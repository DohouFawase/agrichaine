<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

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
        // Récupérer les données déjà validées par le StoreProductRequest
        $validatedData = $request->validated();
        
        // Extraction de la photo pour la traiter séparément du payload de base
        $data = $request->except('stock_proof_photo');

        // Gestion de l'upload sécurisé de la preuve visuelle du stock
        if ($request->hasFile('stock_proof_photo')) {
            $path = $request->file('stock_proof_photo')->store('products/proofs', 'public');
            $data['stock_proof_photo_path'] = Storage::url($path);
        }

        // Fusionner l'ID du producteur connecté (Lier à la clé étrangère de ta base)
        $data['producer_id'] = Auth::guard('api')->id();

        // Création via le Repository pour respecter le découplage
        $product = $this->productRepository->create($data);

        return response()->json([
            'success' => true,
            'message' => 'Produit publié avec succès et stock vérifié.',
            'data' => new ProductResource($product)
        ], 201);
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