<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
;
use App\Http\Resources\OrderResource;
use App\Http\Resources\ProductResource;
use App\Http\Resources\TripResource;
use App\Models\DriverStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\Trip;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
 
/**
 * GET /api/v1/home
 *
 * Retourne un payload home complet et adapté au rôle de l'utilisateur connecté.
 *
 * Rôles supportés :
 *  • buyer       → catalogue produits + commandes actives + wallet (séquestre + transactions)
 *  • producer    → mes produits + commandes liées + wallet (gains + transactions)
 *  • transporter → courses disponibles + mes courses actives + mes trajets + GPS + wallet
 */
class HomeController extends Controller
{
    // ─── Statuts considérés comme "actifs" (non terminés) ───────────────────────
    private const ACTIVE_STATUSES = ['searching', 'assigned', 'collected'];
 
    // ─── Statuts d'escrow acheteur (fonds gelés) ────────────────────────────────
    private const ESCROW_STATUSES = ['searching', 'assigned', 'collected'];
 
    // ─── Statuts terminaux (commandes closes) ───────────────────────────────────
    private const TERMINAL_STATUSES = ['delivered', 'disputed', 'cancelled'];
 
    // ─── Relations Order à charger systématiquement ─────────────────────────────
    private const ORDER_WITH = ['product.producer', 'buyer', 'producer', 'transporter', 'transaction'];
 
    // ─── Relations Product à charger systématiquement ───────────────────────────
    private const PRODUCT_WITH = ['producer'];
 
    // ─── Relations Trip à charger ────────────────────────────────────────────────
    private const TRIP_WITH = ['transporter'];
 
    // ─────────────────────────────────────────────────────────────────────────────
 
    public function __invoke(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
 
        return match ($user->role) {
            'buyer'       => $this->buyerHome($user),
            'producer'    => $this->producerHome($user),
            'transporter' => $this->transporterHome($user),
            default       => response()->json([
                'success' => false,
                'message' => 'Rôle utilisateur non reconnu.',
            ], 400),
        };
    }
 
    // ══════════════════════════════════════════════════════════════════════════════
    //  BUYER
    // ══════════════════════════════════════════════════════════════════════════════
 
    private function buyerHome(User $user): JsonResponse
    {
        /*
         * 1. Commandes actives de l'acheteur
         *    → Toutes les commandes non-terminales avec leurs relations complètes
         */
        $activeOrders = Order::query()
            ->where('buyer_id', $user->id)
            ->whereNotIn('status', self::TERMINAL_STATUSES)
            ->with(self::ORDER_WITH)
            ->latest()
            ->get();
 
        /*
         * 2. Catalogue produits disponibles
         *    → Tous les produits avec statut "available", producteur chargé
         */
        $availableProducts = Product::query()
            ->where('status', 'available')
            ->with(self::PRODUCT_WITH)
            ->latest()
            ->get();
 
        /*
         * 3. Wallet complet (séquestre + transactions récentes)
         */
        $wallet = $this->buildBuyerWallet($user, $activeOrders);
 
        return response()->json([
            'success'   => true,
            'user_role' => 'buyer',
            'data'      => [
                'user'               => $this->buildUserPayload($user),
                'wallet'             => $wallet,
                'active_orders'      => OrderResource::collection($activeOrders),
                'available_products' => ProductResource::collection($availableProducts),
            ],
        ]);
    }
 
    // ══════════════════════════════════════════════════════════════════════════════
    //  PRODUCER
    // ══════════════════════════════════════════════════════════════════════════════
 
    private function producerHome(User $user): JsonResponse
    {
        /*
         * 1. Mes produits publiés (tous statuts confondus)
         */
        $myProducts = Product::query()
            ->where('producer_id', $user->id)
            ->with(self::PRODUCT_WITH)
            ->latest()
            ->get();
 
        /*
         * 2. Toutes les commandes liées à mes produits (non terminées)
         *    → buyer + transporter + product + transaction chargés
         */
        $activeOrders = Order::query()
            ->whereHas('product', fn ($q) => $q->where('producer_id', $user->id))
            ->whereNotIn('status', self::TERMINAL_STATUSES)
            ->with(self::ORDER_WITH)
            ->latest()
            ->get();
 
        /*
         * 3. Wallet producteur (gains + transactions récentes)
         */
        $wallet = $this->buildProducerWallet($user);
 
        return response()->json([
            'success'   => true,
            'user_role' => 'producer',
            'data'      => [
                'user'          => $this->buildUserPayload($user),
                'wallet'        => $wallet,
                'my_products'   => ProductResource::collection($myProducts),
                'active_orders' => OrderResource::collection($activeOrders),
            ],
        ]);
    }
 
    // ══════════════════════════════════════════════════════════════════════════════
    //  TRANSPORTER
    // ══════════════════════════════════════════════════════════════════════════════
 
    private function transporterHome(User $user): JsonResponse
    {
        /*
         * 1. Courses disponibles à saisir
         *    → statut "searching" et aucun transporteur assigné
         */
        $availableOrders = Order::query()
            ->where('status', 'searching')
            ->whereNull('transporter_id')
            ->with(self::ORDER_WITH)
            ->latest()
            ->get();
 
        /*
         * 2. Mes courses actives (assigné, collecté — pas encore livré)
         */
        $myActiveOrders = Order::query()
            ->where('transporter_id', $user->id)
            ->whereNotIn('status', self::TERMINAL_STATUSES)
            ->with(self::ORDER_WITH)
            ->latest()
            ->get();
 
        /*
         * 3. Mes trajets enregistrés
         */
        $myTrips = Trip::query()
            ->where('transporter_id', $user->id)
            ->with(self::TRIP_WITH)
            ->latest()
            ->get();
 
        /*
         * 4. Statut GPS actuel du chauffeur
         */
        $driverStatus = DriverStatus::query()
            ->where('user_id', $user->id)
            ->latest('updated_at')
            ->first();
 
        /*
         * 5. Wallet chauffeur (gains + transactions récentes)
         */
        $wallet = $this->buildTransporterWallet($user);
 
        return response()->json([
            'success'   => true,
            'user_role' => 'transporter',
            'data'      => [
                'user'             => $this->buildUserPayload($user),
                'driver_status'    => $this->buildDriverStatusPayload($driverStatus),
                'wallet'           => $wallet,
                'available_orders' => OrderResource::collection($availableOrders),
                'my_active_orders' => OrderResource::collection($myActiveOrders),
                'my_trips'         => TripResource::collection($myTrips),
            ],
        ]);
    }
 
    // ══════════════════════════════════════════════════════════════════════════════
    //  WALLET BUILDERS
    // ══════════════════════════════════════════════════════════════════════════════
 
    /**
     * Wallet acheteur : séquestre actif + transactions récentes (débits)
     *
     * @param  EloquentCollection<int, Order>  $activeOrders  déjà chargées pour éviter N+1
     */
    private function buildBuyerWallet(User $user, EloquentCollection $activeOrders): array
    {
        /** @var Wallet|null $wallet */
        $wallet = Wallet::query()->where('user_id', $user->id)->first();
 
        // Commandes en séquestre = fonds gelés (subset des commandes actives)
        $escrowOrders = $activeOrders->whereIn('status', self::ESCROW_STATUSES)->values();
 
        $escrowTotal = $escrowOrders->sum(
            fn (Order $o) => ($o->total_price ?? 0) + ($o->delivery_fees ?? 0)
        );
 
        // Transactions récentes de l'acheteur (débits depuis le wallet)
        $recentTransactions = Transaction::query()
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get();
 
        return [
            'balance'             => $wallet?->balance ?? 0,
            'currency'            => 'FCFA',
            'escrow'              => [
                'total_amount'  => $escrowTotal,
                'active_orders' => $escrowOrders->map(
                    fn (Order $o) => $this->buildEscrowOrderItem($o)
                )->values(),
            ],
            'recent_transactions' => $recentTransactions->map(
                fn (Transaction $t) => $this->buildTransactionItem($t, 'debit')
            )->values(),
        ];
    }
 
    /**
     * Wallet producteur : solde + transactions récentes (crédits reçus)
     */
    private function buildProducerWallet(User $user): array
    {
        /** @var Wallet|null $wallet */
        $wallet = Wallet::query()->where('user_id', $user->id)->first();
 
        $recentTransactions = Transaction::query()
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get();
 
        return [
            'balance'             => $wallet?->balance ?? 0,
            'currency'            => 'FCFA',
            'recent_transactions' => $recentTransactions->map(
                fn (Transaction $t) => $this->buildTransactionItem($t, 'credit')
            )->values(),
        ];
    }
 
    /**
     * Wallet transporteur : gains + transactions récentes (crédits de courses)
     */
    private function buildTransporterWallet(User $user): array
    {
        /** @var Wallet|null $wallet */
        $wallet = Wallet::query()->where('user_id', $user->id)->first();
 
        $recentTransactions = Transaction::query()
            ->where('user_id', $user->id)
            ->latest()
            ->take(10)
            ->get();
 
        return [
            'balance'             => $wallet?->balance ?? 0,
            'currency'            => 'FCFA',
            'recent_transactions' => $recentTransactions->map(
                fn (Transaction $t) => $this->buildTransactionItem($t, 'credit')
            )->values(),
        ];
    }
 
    // ══════════════════════════════════════════════════════════════════════════════
    //  PAYLOAD BUILDERS
    // ══════════════════════════════════════════════════════════════════════════════
 
    /**
     * Payload utilisateur complet (champs du schema User de la spec)
     */
    private function buildUserPayload(User $user): array
    {
        return [
            'id'                     => $user->id,
            'name'                   => $user->name,
            'last_name'              => $user->last_name,
            'phone'                  => $user->phone,
            'email'                  => $user->email,
            'role'                   => $user->role,
            'status'                 => $user->status,
            'average_rating'         => $user->average_rating,
            'identity_document_path' => $user->identity_document_path,
            'id_verified_at'         => $user->id_verified_at,
            'email_verified_at'      => $user->email_verified_at,
            'created_at'             => $user->created_at,
            'updated_at'             => $user->updated_at,
        ];
    }
 
    /**
     * Item d'escrow acheteur (champs attendus par le front sur /v1/balance)
     */
    private function buildEscrowOrderItem(Order $order): array
    {
        return [
            'order_id'       => $order->id,
            'product_name'   => $order->product?->name ?? '',
            'quantity'       => (string) $order->quantity_ordered,
            'unit'           => $order->product?->unit ?? '',
            'status_label'   => $order->status === 'collected'
                ? 'Livraison en cours'
                : 'En cours de transport',
            'display_amount' => ($order->total_price ?? 0) + ($order->delivery_fees ?? 0),
        ];
    }
 
    /**
     * Item transaction (champs attendus par le front sur /v1/balance → recent_transactions)
     *
     * @param  string  $displayType  'credit' | 'debit'
     */
    private function buildTransactionItem(Transaction $transaction, string $displayType): array
    {
        return [
            'id'           => $transaction->id,
            'title'        => $displayType === 'credit'
                ? 'Gain course encaissé'
                : 'Paiement commande',
            'amount'       => $transaction->amount,
            'display_type' => $displayType,
            'reference'    => $transaction->payment_reference,
            'status'       => $transaction->status,
            'description'  => $transaction->description ?? null,
            'created_at'   => $transaction->created_at,
        ];
    }
 
    /**
     * Payload statut GPS du chauffeur
     */
    private function buildDriverStatusPayload(?DriverStatus $driverStatus): array
    {
        return [
            'status'     => $driverStatus?->status ?? 'offline',
            'latitude'   => $driverStatus?->latitude,
            'longitude'  => $driverStatus?->longitude,
            'updated_at' => $driverStatus?->updated_at,
        ];
    }
}
