<?php

namespace App\Http\Controllers\Api\V1\Product;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Events\ProductPublished;
use App\Models\User;
use App\Models\Product;
use App\Models\ProductFavorite;
use App\Models\ProductReview;
use App\Models\Order;
use App\Models\Category;
use Illuminate\Support\Facades\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Gate;
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
            $products = Product::where('producer_id', $userId)
                ->with('categoryRelation')
                ->withAvg('reviews', 'rating')
                ->withCount('reviews')
                ->latest()->paginate($request->integer('per_page', 15));

            return response()->json([
                'success' => true,
                'user_role' => 'producer',
                'data' => ProductResource::collection($products),
                'meta' => $this->paginationMeta($products),
            ]);
        }

        // 2. Logique pour l'ACHETEUR (ou utilisateur non connecté/invité)
        Log::info("Onabaya-Log: Consultation du catalogue global par l'acheteur.");

        // Utilise ta méthode du Repository qui filtre uniquement les produits 'available' et quantité > 0
        $products = $this->productRepository->getAvailable($request->only([
            'search', 'category', 'location', 'min_price', 'max_price', 'per_page'
        ]));

        return response()->json([
            'success' => true,
            'user_role' => 'buyer',
            'data' => ProductResource::collection($products),
            'meta' => $this->paginationMeta($products),
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
        $data = $this->normalizeCategoryData($data);

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
        $productModel = $this->productRepository->find($product)
            ->loadAvg('reviews', 'rating')
            ->loadCount('reviews');
        $productModel->is_favorite = ProductFavorite::where('user_id', auth('api')->id())
            ->where('product_id', $productModel->id)->exists();

        return response()->json([
            'success' => true,
            'data' => new ProductResource($productModel)
        ]);
    }

    public function update(UpdateProductRequest $request, string $product): JsonResponse
    {
        $productModel = $this->productRepository->find($product);
        Gate::authorize('update', $productModel);

        $data = $request->safe()->except('stock_proof_photo');
        $data = $this->normalizeCategoryData($data);

        if ($request->hasFile('stock_proof_photo')) {
            $this->deleteStoredFile($productModel->stock_proof_photo_path);
            $path = $request->file('stock_proof_photo')->store('products/proofs', 'public');
            $data['stock_proof_photo_path'] = Storage::url($path);
        }

        if (array_key_exists('quantity', $data) && isset($productModel->reserved_quantity) && (float) $data['quantity'] < (float) $productModel->reserved_quantity) {
            return response()->json([
                'success' => false,
                'message' => 'La quantité ne peut pas être inférieure au stock déjà réservé.',
            ], 422);
        }

        if (array_key_exists('quantity', $data) && (float) $data['quantity'] > 0 && ($productModel->status === 'sold_out' || $productModel->quantity <= 0)) {
            $data['status'] = 'available';
        }

        $updatedProduct = $this->productRepository->update($product, $data);

        return response()->json([
            'success' => true,
            'message' => 'Produit mis à jour avec succès.',
            'data' => new ProductResource($updatedProduct->load(['producer', 'categoryRelation'])),
        ]);
    }

    public function destroy(Request $request, string $product): JsonResponse
    {
        $productModel = $this->productRepository->find($product);
        Gate::authorize('delete', $productModel);
        $this->productRepository->delete($product);

        return response()->json([
            'success' => true,
            'message' => 'Produit archivé avec succès.',
        ]);
    }

    public function destroyAll(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === 'producer', 403, 'Seul un producteur peut archiver ses produits.');

        $producerId = Auth::guard('api')->id() ?? $request->user()?->id;
        $products = \App\Models\Product::where('producer_id', $producerId)->get();

        foreach ($products as $product) {
            $this->deleteStoredFile($product->stock_proof_photo_path);
        }

        $deletedCount = $this->productRepository->deleteAllByProducer($producerId);

        return response()->json([
            'success' => true,
            'message' => $deletedCount === 0
                ? 'Aucun produit à archiver.'
                : 'Tous vos produits ont été archivés avec succès.',
            'deleted_count' => $deletedCount,
        ]);
    }

    public function restore(Request $request, string $product): JsonResponse
    {
        abort_unless($request->user()?->role === 'producer', 403);
        $productModel = Product::withTrashed()->findOrFail($product);
        Gate::authorize('restore', $productModel);

        if ($productModel->quantity <= 0 || ($productModel->expires_at && $productModel->expires_at->isPast())) {
            return response()->json(['success' => false, 'message' => 'Ce produit ne peut pas être restauré.'], 422);
        }

        $productModel->restore();
        $productModel->update(['status' => 'available']);

        return response()->json(['success' => true, 'message' => 'Produit restauré avec succès.', 'data' => new ProductResource($productModel->fresh()->load('categoryRelation'))]);
    }

    public function favorite(Request $request, string $product): JsonResponse
    {
        $productModel = $this->productRepository->find($product);
        ProductFavorite::firstOrCreate(['user_id' => $request->user()->id, 'product_id' => $productModel->id]);

        return response()->json(['success' => true, 'message' => 'Produit ajouté aux favoris.']);
    }

    public function unfavorite(Request $request, string $product): JsonResponse
    {
        ProductFavorite::where('user_id', $request->user()->id)->where('product_id', $product)->delete();

        return response()->json(['success' => true, 'message' => 'Produit retiré des favoris.']);
    }

    public function favorites(Request $request): JsonResponse
    {
        $products = $request->user()->favoriteProducts()->with('producer')->withAvg('reviews', 'rating')->withCount('reviews')->paginate($request->integer('per_page', 15));

        return response()->json(['success' => true, 'data' => ProductResource::collection($products), 'meta' => $this->paginationMeta($products)]);
    }

    public function review(Request $request, string $product): JsonResponse
    {
        $data = $request->validate(['order_id' => ['required', 'uuid'], 'rating' => ['required', 'integer', 'between:1,5'], 'comment' => ['nullable', 'string', 'max:2000']]);
        $order = Order::where('id', $data['order_id'])->where('buyer_id', $request->user()->id)->firstOrFail();

        abort_unless($order->product_id === $product && $order->status === 'delivered', 422, 'Un avis est possible uniquement après une livraison.');
        abort_if(ProductReview::where('order_id', $order->id)->where('reviewer_id', $request->user()->id)->exists(), 409, 'Cette commande a déjà été notée.');

        $review = ProductReview::create(['product_id' => $product, 'order_id' => $order->id, 'reviewer_id' => $request->user()->id, 'rating' => $data['rating'], 'comment' => $data['comment'] ?? null]);

        return response()->json(['success' => true, 'message' => 'Avis produit enregistré.', 'data' => $review], 201);
    }

    private function ensureOwner(\App\Models\Product $product, Request $request): void
    {
        abort_unless(
            (string) $product->producer_id === (string) (Auth::guard('api')->id() ?? $request->user()?->id),
            403,
            'Vous ne pouvez gérer que vos propres produits.'
        );
    }

    private function paginationMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }

    private function normalizeCategoryData(array $data): array
    {
        if (!empty($data['category_id'])) {
            $data['category'] = $data['category'] ?? Category::find($data['category_id'])?->slug;
            return $data;
        }

        if (!empty($data['category'])) {
            $category = Category::where('slug', $data['category'])
                ->orWhere('name', $data['category'])
                ->first();
            $data['category_id'] = $category?->id;
        }

        return $data;
    }

    private function deleteStoredFile(?string $url): void
    {
        if ($url) {
            $path = parse_url($url, PHP_URL_PATH);
            $path = $path ? preg_replace('#^/storage/#', '', $path) : $url;
            Storage::disk('public')->delete(ltrim($path, '/'));
        }
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
