<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Exception;

class MtnMomoService
{
    protected $baseUrl = 'https://sandbox.momodeveloper.mtn.com';
    protected $subscriptionKey;
    protected $apiUser;
    protected $apiKey;

    public function __construct()
    {
        $this->subscriptionKey = config('services.mtn_momo.subscription_key');
        $this->apiUser = config('services.mtn_momo.api_user');
        $this->apiKey = config('services.mtn_momo.api_key');
    }

    /**
     * 1. Obtenir le Token d'accès Basic Auth
     */
    public function getAccessToken(): string
    {
        // L'authentification MTN requiert un encodage en Base64 de "api_user:api_key"
        $credentials = base64_encode($this->apiUser . ':' . $this->apiKey);

        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . $credentials,
            'Ocp-Apim-Subscription-Key' => $this->subscriptionKey,
        ])->post($this->baseUrl . '/collection/token/');

        if ($response->failed()) {
            throw new Exception('Impossible de générer le Token MoMo : ' . $response->body());
        }

        return $response->json()['access_token'];
    }

    /**
     * 2. Lancer une demande de paiement (Request To Pay)
     */
    public function requestToPay(string $amount, string $phoneNumber, string $externalId): string
    {
        $token = $this->getAccessToken();
        
        // MTN exige un UUID unique pour identifier chaque transaction
        $transactionId = (string) Str::uuid();

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'X-Reference-Id' => $transactionId,
            'X-Target-Environment' => config('services.mtn_momo.env'),
            'Ocp-Apim-Subscription-Key' => $this->subscriptionKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/collection/v1_0/requesttopay', [
            'amount' => $amount,
            'currency' => 'XOF', // Devise locale
            'externalId' => $externalId,
            'payer' => [
                'partyIdType' => 'MSISDN',
                'partyId' => $phoneNumber, // Ex: "22997000000"
            ],
            'payerMessage' => 'Paiement de votre commande sur Onabaya',
            'payeeNote' => 'Séquestre Onabaya Logistique'
        ]);

        if ($response->failed()) {
            throw new Exception('Échec de la demande de paiement : ' . $response->body());
        }

        // On retourne l'ID de la transaction pour pouvoir vérifier son statut plus tard
        return $transactionId;
    }
}