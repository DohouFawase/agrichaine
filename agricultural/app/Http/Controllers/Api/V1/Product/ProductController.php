<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Events\ProductPublished;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Notifications\NewProductPublished;
use Exception;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected $productRepository;

    public function __construct(ProductRepositoryInterface $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    /**
     * Afficher les produits selon le rôle de l'utilisateur connecté
     * GET api/v1/products
     */
    public function index(\Illuminate\Http\Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = Auth::guard('api')->id() ?? $user?->id;

        // 1. Logique pour le VENDEUR / PRODUCTEUR
        if ($user && $user->role === 'producer') { // Ajuste 'producer' selon le nom exact de ton rôle vendeur
            Log::info("Onabaya-Log: Le vendeur #{$userId} consulte ses propres publications.");

            // On récupère TOUS ses produits (même s'ils sont épuisés ou vendus)
            $products = \App\Models\Product::where('producer_id', $userId)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'user_role' => 'producer',
                'data' => ProductResource::collection($products)
            ]);
        }

        // 2. Logique pour l'ACHETEUR (ou utilisateur non connecté/invité)
        Log::info("Onabaya-Log: Consultation du catalogue global par l'acheteur.");

        // Utilise ta méthode du Repository qui filtre uniquement les produits 'available' et quantité > 0
        $products = $this->productRepository->getAvailable();

        return response()->json([
            'success' => true,
            'user_role' => 'buyer',
            'data' => ProductResource::collection($products)
        ]);
    }

    /**
     * Publier une nouvelle récolte avec Preuve Photo (Pour le Producteur)
     * POST api/v1/products
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $request->validated();

        $data = $request->except('stock_proof_photo');

        if ($request->hasFile('stock_proof_photo')) {
            $path = $request->file('stock_proof_photo')->store('products/proofs', 'public');
            $data['stock_proof_photo_path'] = Storage::url($path);
        }

        // Récupération sécurisée de l'ID du producteur connecté
        $data['producer_id'] = Auth::guard('api')->id() ?? $request->user()?->id;

        try {
            Log::info('Onabaya-Log: Début de la publication du produit par le producteur #' . $data['producer_id']);

            // 1. Écriture sécurisée en BDD uniquement dans la transaction
            $product = DB::transaction(function () use ($data) {
                return $this->productRepository->create($data);
            });

            Log::info('Onabaya-Log: Produit inséré avec succès en BDD. ID #' . $product->id);

            // 2. ⚡ Déclenchement du Broadcast APRES le commit de la transaction
            // Cela évite que Reverb ou les Queues cherchent un produit non encore validé en BDD
            broadcast(new ProductPublished($product))->toOthers();

            Log::info('Onabaya-Log: Événement ProductPublished envoyé avec succès au serveur Reverb.');
            $buyers = User::where('role', 'buyer')->get();
            Notification::send($buyers, new NewProductPublished($product));
            Log::info('Onabaya-Log: Notifications DB envoyées à ' . $buyers->count() . ' acheteur(s).');



            return response()->json([
                'success' => true,
                'message' => 'Produit publié avec succès et notifié aux acheteurs du marché.',
                'data' => new ProductResource($product)
            ], 201);
        } catch (Exception $e) {
            Log::error('Onabaya-Log: Échec lors de la publication du produit. Message: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la publication : ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Voir les détails d'un produit spécifique
     * GET api/v1/products/{id}
     */
    public function show(string $product): JsonResponse
    {
        // $product contient ici l'ID ou l'UUID passé dans l'URL
        $productModel = $this->productRepository->find($product);

        return response()->json([
            'success' => true,
            'data' => new ProductResource($productModel)
        ]);
    }


    /**
     * Voir les produits publiés par le producteur connecté
     * GET api/v1/producer/products
     */
    public function producerProducts(Request $request): JsonResponse
    {
        $producerId = auth()->guard('api')->id() ?? $request->user()?->id;

        // Tu peux ajouter une méthode dans ton Repository, ou le faire en direct ici pour tester :
        $products = \App\Models\Product::where('producer_id', $producerId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProductResource::collection($products)
        ]);
    }
}
