<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Exception;

class MtnMomoService
{
    protected string $baseUrl;
    protected string $subscriptionKey;
    protected string $apiUser;
    protected string $apiKey;
    protected string $environment;

    // 🔧 AJOUT : credentials séparés pour l'API Disbursement (retraits),
    // distincte de l'API Collection (recharges/paiements) utilisée ci-dessus.
    // À renseigner dans .env : MOMO_DISBURSEMENT_SUBSCRIPTION_KEY, etc.
    // Si non configurées séparément, retombe sur les clés Collection (utile
    // en sandbox où un seul jeu de clés suffit souvent pour les deux produits).
    protected string $disbursementSubscriptionKey;
    protected string $disbursementApiUser;
    protected string $disbursementApiKey;

    public function __construct()
    {
        $this->environment = config('services.mtn_momo.env', 'sandbox');

        $this->baseUrl = $this->environment === 'sandbox'
            ? 'https://sandbox.momodeveloper.mtn.com'
            : config('services.mtn_momo.prod_base_url', 'https://proxy.momodeveloper.mtn.com');

        $this->subscriptionKey = config('services.mtn_momo.subscription_key') ?? '';
        $this->apiUser = config('services.mtn_momo.api_user') ?? '';
        $this->apiKey = config('services.mtn_momo.api_key') ?? '';

        // 🔧 AJOUT
        $this->disbursementSubscriptionKey = config('services.mtn_momo.disbursement_subscription_key')
            ?? $this->subscriptionKey;
        $this->disbursementApiUser = config('services.mtn_momo.disbursement_api_user')
            ?? $this->apiUser;
        $this->disbursementApiKey = config('services.mtn_momo.disbursement_api_key')
            ?? $this->apiKey;
    }

    /**
     * 1. Obtenir le Token d'accès (Mis en cache pour 50 min)
     */
    public function getAccessToken(): string
    {
        return Cache::remember('mtn_momo_access_token', now()->addMinutes(50), function () {
            Log::info('[MoMo API] Génération d\'un nouveau Token d\'accès...');

            $credentials = base64_encode($this->apiUser . ':' . $this->apiKey);

            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . $credentials,
                'Ocp-Apim-Subscription-Key' => $this->subscriptionKey,
            ])->post($this->baseUrl . '/collection/token/');

            if ($response->failed()) {
                Log::error('[MoMo API] Échec de génération du Token', [
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                throw new Exception('Impossible de générer le Token MoMo : ' . $response->body());
            }

            $token = $response->json()['access_token'];
            Log::info('[MoMo API] Nouveau Token généré et mis en cache.');

            return $token;
        });
    }

    /**
     * 2. Lancer une demande de paiement (Request To Pay)
     *
     * 🔧 CORRIGÉ — BUG CRITIQUE : cette méthode générait auparavant son PROPRE
     * identifiant ($transactionId = Str::uuid()) pour le header X-Reference-Id
     * envoyé à MTN, tout en recevant un $externalId différent (notre référence
     * interne, MomoTransaction::external_reference) qui n'était envoyé qu'en
     * tant que simple champ 'externalId' dans le corps de la requête — jamais
     * comme identifiant de recherche côté MTN.
     *
     * Résultat : getTransactionStatus() interrogeait ensuite MTN avec NOTRE
     * référence, que MTN n'avait jamais reçue comme X-Reference-Id → 404
     * RESOURCE_NOT_FOUND systématique, à chaque appel, sans exception.
     *
     * Désormais, $externalId (fourni par l'appelant) EST l'identifiant envoyé
     * à MTN comme X-Reference-Id. C'est cette même valeur qui doit être
     * utilisée pour interroger le statut ensuite — garantissant la cohérence.
     */
    public function requestToPay(string $amount, string $phoneNumber, string $externalId, ?string $callbackUrl = null): string
    {
        $token = $this->getAccessToken();

        // En Sandbox, MTN impose EUR. En Prod, on utilise XOF.
        $currency = $this->environment === 'sandbox' ? 'EUR' : 'XOF';

        $headers = [
            'Authorization' => 'Bearer ' . $token,
            'X-Reference-Id' => $externalId, // 🔧 CORRIGÉ : notre référence, plus un UUID interne jetable
            'X-Target-Environment' => $this->environment,
            'Ocp-Apim-Subscription-Key' => $this->subscriptionKey,
            'Content-Type' => 'application/json',
        ];

        if ($callbackUrl) {
            $headers['X-Callback-Url'] = $callbackUrl;
        }

        Log::info('[MoMo API] Initiation RequestToPay', [
            'reference_id' => $externalId,
            'amount' => $amount,
            'currency' => $currency,
            'phone' => $phoneNumber,
        ]);

        $response = Http::withHeaders($headers)->post($this->baseUrl . '/collection/v1_0/requesttopay', [
            'amount' => $amount,
            'currency' => $currency,
            'externalId' => $externalId, // champ métier MTN, on garde la même valeur par cohérence
            'payer' => [
                'partyIdType' => 'MSISDN',
                'partyId' => $phoneNumber,
            ],
            'payerMessage' => 'Paiement commande',
            'payeeNote' => 'Règlement Marchand'
        ]);

        if ($response->failed()) {
            Log::error('[MoMo API] Échec de l\'initiation du paiement', [
                'reference_id' => $externalId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            throw new Exception('Échec de la demande de paiement : ' . $response->body());
        }

        Log::info('[MoMo API] Demande de paiement acceptée (202 Accepted)', [
            'reference_id' => $externalId
        ]);

        // 🔧 CORRIGÉ : on retourne désormais la référence réellement enregistrée
        // chez MTN (celle qu'il faudra utiliser pour interroger le statut),
        // au lieu d'un UUID jetable jamais réutilisable.
        return $externalId;
    }

    /**
     * 3. Vérifier le statut d'une transaction
     * ⚠️ Le $transactionId passé ici DOIT être exactement la valeur envoyée
     * comme X-Reference-Id lors de requestToPay() — donc notre external_reference.
     */
    public function getTransactionStatus(string $transactionId): array
    {
        $token = $this->getAccessToken();

        Log::info('[MoMo API] Vérification du statut de la transaction', [
            'transaction_id' => $transactionId
        ]);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'X-Target-Environment' => $this->environment,
            'Ocp-Apim-Subscription-Key' => $this->subscriptionKey,
        ])->get($this->baseUrl . '/collection/v1_0/requesttopay/' . $transactionId);

        if ($response->failed()) {
            Log::error('[MoMo API] Impossible de récupérer le statut', [
                'transaction_id' => $transactionId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            throw new Exception('Échec de récupération du statut : ' . $response->body());
        }

        $data = $response->json();

        Log::info('[MoMo API] Statut de transaction récupéré', [
            'transaction_id' => $transactionId,
            'momo_status' => $data['status'] ?? 'UNKNOWN'
        ]);

        return $data;
    }

    /**
     * 🔧 AJOUT — Obtenir le Token d'accès pour l'API Disbursement (retraits).
     * Séparé du token Collection : endpoint et credentials différents.
     */
    public function getDisbursementAccessToken(): string
    {
        return Cache::remember('mtn_momo_disbursement_access_token', now()->addMinutes(50), function () {
            Log::info('[MoMo API][Disbursement] Génération d\'un nouveau Token d\'accès...');

            $credentials = base64_encode($this->disbursementApiUser . ':' . $this->disbursementApiKey);

            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . $credentials,
                'Ocp-Apim-Subscription-Key' => $this->disbursementSubscriptionKey,
            ])->post($this->baseUrl . '/disbursement/token/');

            if ($response->failed()) {
                Log::error('[MoMo API][Disbursement] Échec de génération du Token', [
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);
                throw new Exception('Impossible de générer le Token MoMo Disbursement : ' . $response->body());
            }

            return $response->json()['access_token'];
        });
    }

    /**
     * 🔧 AJOUT — Envoie de l'argent vers un numéro (retrait wallet -> Mobile Money).
     * $externalId doit être notre référence interne, réutilisée telle quelle
     * comme X-Reference-Id (même logique/correction que requestToPay ci-dessus).
     */
    public function transfer(string $amount, string $phoneNumber, string $externalId): string
    {
        $token = $this->getDisbursementAccessToken();
        $currency = $this->environment === 'sandbox' ? 'EUR' : 'XOF';

        $headers = [
            'Authorization' => 'Bearer ' . $token,
            'X-Reference-Id' => $externalId,
            'X-Target-Environment' => $this->environment,
            'Ocp-Apim-Subscription-Key' => $this->disbursementSubscriptionKey,
            'Content-Type' => 'application/json',
        ];

        Log::info('[MoMo API][Disbursement] Initiation Transfer', [
            'reference_id' => $externalId,
            'amount' => $amount,
            'phone' => $phoneNumber,
        ]);

        $response = Http::withHeaders($headers)->post($this->baseUrl . '/disbursement/v1_0/transfer', [
            'amount' => $amount,
            'currency' => $currency,
            'externalId' => $externalId,
            'payee' => [
                'partyIdType' => 'MSISDN',
                'partyId' => $phoneNumber,
            ],
            'payerMessage' => 'Retrait portefeuille',
            'payeeNote' => 'Retrait Onabaya',
        ]);

        if ($response->failed()) {
            Log::error('[MoMo API][Disbursement] Échec du transfert', [
                'reference_id' => $externalId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            throw new Exception('Échec de la demande de retrait : ' . $response->body());
        }

        return $externalId;
    }

    /**
     * 🔧 AJOUT — Vérifie le statut d'un retrait (Disbursement).
     */
    public function getTransferStatus(string $transactionId): array
    {
        $token = $this->getDisbursementAccessToken();

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'X-Target-Environment' => $this->environment,
            'Ocp-Apim-Subscription-Key' => $this->disbursementSubscriptionKey,
        ])->get($this->baseUrl . '/disbursement/v1_0/transfer/' . $transactionId);

        if ($response->failed()) {
            Log::error('[MoMo API][Disbursement] Impossible de récupérer le statut', [
                'transaction_id' => $transactionId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            throw new Exception('Échec de récupération du statut du retrait : ' . $response->body());
        }

        return $response->json();
    }

    /**
     * 4. Valider le format d'un numéro de téléphone (MSISDN)
     */
    public function formatPhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        return $cleaned;
    }
}