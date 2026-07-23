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

    public function __construct()
    {
        $this->environment = config('services.mtn_momo.env', 'sandbox');
        
        // URL dynamique : Sandbox vs Production
        $this->baseUrl = $this->environment === 'sandbox' 
            ? 'https://sandbox.momodeveloper.mtn.com' 
            : config('services.mtn_momo.prod_base_url', 'https://proxy.momodeveloper.mtn.com');

        $this->subscriptionKey = config('services.mtn_momo.subscription_key') ?? '';
        $this->apiUser = config('services.mtn_momo.api_user') ?? '';
        $this->apiKey = config('services.mtn_momo.api_key') ?? '';
    }

    /**
     * 1. Obtenir le Token d'accès (Mis en cache pour 50 min)
     */
    public function getAccessToken(): string
    {
        // On vérifie d'abord si un token valide existe en cache
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
     */
    public function requestToPay(string $amount, string $phoneNumber, string $externalId, ?string $callbackUrl = null): string
    {
        $token = $this->getAccessToken();
        $transactionId = (string) Str::uuid();

        // En Sandbox, MTN impose EUR. En Prod, on utilise XOF.
        $currency = $this->environment === 'sandbox' ? 'EUR' : 'XOF';

        $headers = [
            'Authorization' => 'Bearer ' . $token,
            'X-Reference-Id' => $transactionId,
            'X-Target-Environment' => $this->environment,
            'Ocp-Apim-Subscription-Key' => $this->subscriptionKey,
            'Content-Type' => 'application/json',
        ];

        // Optionnel : Notification instantanée via Callback Webhook si fourni
        if ($callbackUrl) {
            $headers['X-Callback-Url'] = $callbackUrl;
        }

        Log::info('[MoMo API] Initiation RequestToPay', [
            'transaction_id' => $transactionId,
            'amount' => $amount,
            'currency' => $currency,
            'phone' => $phoneNumber,
            'external_id' => $externalId
        ]);

        $response = Http::withHeaders($headers)->post($this->baseUrl . '/collection/v1_0/requesttopay', [
            'amount' => $amount,
            'currency' => $currency,
            'externalId' => $externalId,
            'payer' => [
                'partyIdType' => 'MSISDN',
                'partyId' => $phoneNumber,
            ],
            'payerMessage' => 'Paiement commande',
            'payeeNote' => 'Règlement Marchand'
        ]);

        if ($response->failed()) {
            Log::error('[MoMo API] Échec de l\'initiation du paiement', [
                'transaction_id' => $transactionId,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            throw new Exception('Échec de la demande de paiement : ' . $response->body());
        }

        Log::info('[MoMo API] Demande de paiement acceptée (202 Accepted)', [
            'transaction_id' => $transactionId
        ]);

        return $transactionId;
    }

    /**
     * 3. Vérifier le statut d'une transaction
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
     * 4. Valider le format d'un numéro de téléphone (MSISDN)
     */
    public function formatPhoneNumber(string $phone): string
    {
        // Enlève les espaces, tirets et le '+'
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        return $cleaned;
    }
}