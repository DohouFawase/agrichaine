<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Events\ProductPublished;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // ✅ Confirmé pour le débuggage terrain
use Exception;

class ProductController extends Controller
{
    protected $productRepository;

    public function __construct(ProductRepositoryInterface $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    /**
     * Afficher le catalogue des produits disponibles (Pour l'Acheteur)
     * GET api/v1/products
     */
    public function index(): JsonResponse
    {
        $products = $this->productRepository->getAvailable();

        return response()->json([
            'success' => true,
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
    public function show(string $id): JsonResponse
    {
        $product = $this->productRepository->find($id);

        return response()->json([
            'success' => true,
            'data' => new ProductResource($product)
        ]);
    }
}