<?php

namespace App\Http\Controllers\Api\V1\Wallet;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Exception;

class WalletController extends Controller
{
    /**
     * Consulter le solde du portefeuille
     * GET api/v1/wallet/balance
     */
   /**
     * Obtenir le résumé complet du portefeuille (Solde, Séquestre, Historique adapté au rôle)
     * GET api/v1/wallet/summary
     */
    public function getWalletSummary(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $userRole = $request->user()->role; // 'buyer', 'producer', 'transporter'

        // 1. Récupérer ou créer le portefeuille
        $wallet = Wallet::firstOrCreate(
            ['user_id' => $userId],
            ['balance' => 0.00, 'currency' => 'XOF']
        );

        // 2. Calcul du montant total "En séquestre" (Logique précédente conservée)
        $escrowAmount = 0;
        $escrowOrders = collect();

        if ($userRole === 'buyer') {
            $ordersQuery = Order::where('buyer_id', $userId)
                ->whereNotIn('status', ['delivered', 'pending_payment'])
                ->with(['product']);
            $escrowAmount = (int) $ordersQuery->sum(DB::raw('total_price + delivery_fees'));
            $escrowOrders = $ordersQuery->orderBy('created_at', 'desc')->get();

        } elseif ($userRole === 'producer') {
            $ordersQuery = Order::whereHas('product', function ($q) use ($userId) {
                $q->where('products.producer_id', $userId);
            })->whereIn('status', ['paid_searching_driver', 'assigned_to_driver', 'collected'])->with(['product']);
            $escrowAmount = (int) $ordersQuery->sum('total_price');
            $escrowOrders = $ordersQuery->orderBy('created_at', 'desc')->get();

        } elseif ($userRole === 'transporter') {
            $ordersQuery = Order::where('transporter_id', $userId)
                ->whereIn('status', ['assigned_to_driver', 'collected'])->with(['product']);
            $escrowAmount = (int) $ordersQuery->sum('delivery_fees');
            $escrowOrders = $ordersQuery->orderBy('created_at', 'desc')->get();
        }

        // 3. Récupérer et adapter l'historique selon le rôle pour ton UI
        $transactions = WalletTransaction::where('wallet_id', $wallet->id)
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get();

        $formattedTransactions = $transactions->map(function ($tx) use ($userRole) {
            $title = 'Transaction';
            $displayType = $tx->type; // 'credit' ou 'debit' pour simplifier le style sur Expo

            switch ($tx->type) {
                case 'deposit':
                    $title = 'Dépôt Mobile Money';
                    $displayType = 'credit';
                    break;
                
                case 'withdrawal':
                    $title = 'Retrait Mobile Money';
                    $displayType = 'debit';
                    break;

                case 'escrow_lock':
                    if ($userRole === 'buyer') {
                        $title = 'Achat : Fonds bloqués au séquestre';
                        $displayType = 'debit'; // L'argent quitte son solde disponible
                    } elseif ($userRole === 'producer') {
                        $title = 'Vente : Fonds sécurisés au séquestre';
                        $displayType = 'pending'; // En attente
                    } elseif ($userRole === 'transporter') {
                        $title = 'Course : Frais sécurisés au séquestre';
                        $displayType = 'pending';
                    }
                    break;

                case 'escrow_unlock':
                    if ($userRole === 'producer') {
                        $title = 'Vente encaissée (Livraison réussie)';
                        $displayType = 'credit'; // Devient disponible sur son solde
                    } elseif ($userRole === 'transporter') {
                        $title = 'Gain course encaissé';
                        $displayType = 'credit';
                    }
                    break;
            }

            return [
                'id' => $tx->id,
                'title' => $title, // 🎯 Idéal pour le gros texte de la ligne d'historique
                'amount' => (float) $tx->amount,
                'display_type' => $displayType, // Permet de mettre le texte en Vert (credit) ou Noir/Rouge (debit)
                'reference' => $tx->reference,
                'description' => $tx->description,
                'created_at' => $tx->created_at->toIso8601String()
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => (float) $wallet->balance,
                'currency' => $wallet->currency,
                'user_role' => $userRole,
                'escrow' => [
                    'total_amount' => $escrowAmount,
                    'active_orders' => $escrowOrders->map(function ($order) use ($userRole) {
                        return [
                            'order_id' => $order->id,
                            'product_name' => $order->product->name ?? 'Produit',
                            'quantity' => $order->quantity_ordered,
                            'unit' => $order->product->unit ?? 'sacs',
                            'status_label' => $order->status === 'collected' ? 'En cours de transport' : 'Livraison en cours',
                            'display_amount' => $userRole === 'buyer' 
                                ? ($order->total_price + $order->delivery_fees) 
                                : ($userRole === 'producer' ? $order->total_price : $order->delivery_fees)
                        ];
                    })
                ],
                'recent_transactions' => $formattedTransactions
            ]
        ]);
    }

    /**
     * Simuler ou valider un dépôt Mobile Money (MTN / Moov)
     * POST api/v1/wallet/deposit
     */
    public function deposit(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:100', // Minimum 100 FCFA
            'transaction_reference' => 'required|string|unique:wallet_transactions,reference',
        ]);

        try {
            $user = $request->user();
            
            $result = DB::transaction(function () use ($user, $request) {
                // Verrouiller le portefeuille pour éviter les écritures simultanées
                $wallet = Wallet::where('user_id', $user->id)->lockForUpdate()->firstOrCreate(
                    ['user_id' => $user->id],
                    ['balance' => 0.00, 'currency' => 'XOF']
                );

                // 1. Créditer le solde
                $wallet->increment('balance', $request->amount);

                // 2. Historiser la transaction
                WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'amount' => $request->amount,
                    'type' => 'deposit',
                    'reference' => $request->transaction_reference,
                    'description' => 'Dépôt Mobile Money réussi'
                ]);

                return $wallet;
            });

            return response()->json([
                'success' => true,
                'new_balance' => $result->balance,
                'message' => 'Votre portefeuille a été rechargé avec succès.'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Échec du rechargement : ' . $e->getMessage()
            ], 422);
        }
    }
}
