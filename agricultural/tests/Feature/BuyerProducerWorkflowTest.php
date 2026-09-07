<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BuyerProducerWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_producer_can_publish_a_product_with_stock_proof(): void
    {
        $producer = $this->createUser('producer');

        $response = $this->apiAs($producer)->post('/api/v1/products', [
            'name' => 'Maïs local',
            'quantity' => 50,
            'unit' => 'kg',
            'price_per_unit' => 800,
            'location' => 'Abomey',
            'stock_proof_photo' => UploadedFile::fake()->image('stock.jpg'),
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Maïs local');

        $this->assertDatabaseHas('products', [
            'producer_id' => $producer->id,
            'name' => 'Maïs local',
            'quantity' => 50,
        ]);
    }

    public function test_buyer_can_view_the_available_catalogue(): void
    {
        $buyer = $this->createUser('buyer');
        $producer = $this->createUser('producer');

        Product::create([
            'producer_id' => $producer->id,
            'name' => 'Riz local',
            'quantity' => 25,
            'unit' => 'sac',
            'price_per_unit' => 12000,
            'location' => 'Porto-Novo',
            'status' => 'available',
        ]);

        $this->apiAs($buyer)->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('user_role', 'buyer')
            ->assertJsonPath('data.0.name', 'Riz local');
    }

    public function test_buyer_cannot_publish_a_product(): void
    {
        $buyer = $this->createUser('buyer');

        $this->apiAs($buyer)->post('/api/v1/products', [
            'name' => 'Produit interdit',
            'quantity' => 10,
            'unit' => 'kg',
            'price_per_unit' => 500,
            'location' => 'Cotonou',
            'stock_proof_photo' => UploadedFile::fake()->image('stock.jpg'),
        ])->assertForbidden();
    }

    public function test_producer_can_update_own_product(): void
    {
        $producer = $this->createUser('producer');
        $product = Product::create([
            'producer_id' => $producer->id,
            'name' => 'Riz local',
            'quantity' => 25,
            'unit' => 'sac',
            'price_per_unit' => 12000,
            'location' => 'Porto-Novo',
            'status' => 'available',
        ]);

        $this->apiAs($producer)->patchJson('/api/v1/products/' . $product->id, [
            'name' => 'Riz local premium',
            'price_per_unit' => 15000,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Riz local premium')
            ->assertJsonPath('data.price_per_unit', 15000);
    }

    public function test_producer_cannot_update_another_producers_product(): void
    {
        $owner = $this->createUser('producer');
        $otherProducer = $this->createUser('producer');
        $product = Product::create([
            'producer_id' => $owner->id,
            'name' => 'Riz local',
            'quantity' => 25,
            'unit' => 'sac',
            'price_per_unit' => 12000,
            'location' => 'Porto-Novo',
            'status' => 'available',
        ]);

        $this->apiAs($otherProducer)->patchJson('/api/v1/products/' . $product->id, [
            'name' => 'Modification interdite',
        ])->assertForbidden();
    }

    public function test_producer_can_archive_own_product(): void
    {
        $producer = $this->createUser('producer');
        $product = Product::create([
            'producer_id' => $producer->id,
            'name' => 'Riz local',
            'quantity' => 25,
            'unit' => 'sac',
            'price_per_unit' => 12000,
            'location' => 'Porto-Novo',
            'status' => 'available',
        ]);

        $this->apiAs($producer)->deleteJson('/api/v1/products/' . $product->id)
            ->assertOk()
            ->assertJsonPath('message', 'Produit archivé avec succès.');

        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }

    public function test_producer_can_archive_all_own_products_without_affecting_another_producer(): void
    {
        $producer = $this->createUser('producer');
        $otherProducer = $this->createUser('producer');

        $ownProduct = Product::create([
            'producer_id' => $producer->id,
            'name' => 'Maïs local',
            'quantity' => 10,
            'unit' => 'sac',
            'price_per_unit' => 8000,
            'location' => 'Abomey',
            'status' => 'available',
        ]);
        $otherProduct = Product::create([
            'producer_id' => $otherProducer->id,
            'name' => 'Riz local',
            'quantity' => 10,
            'unit' => 'sac',
            'price_per_unit' => 12000,
            'location' => 'Porto-Novo',
            'status' => 'available',
        ]);

        $this->apiAs($producer)->deleteJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('deleted_count', 1);

        $this->assertSoftDeleted('products', ['id' => $ownProduct->id]);
        $this->assertDatabaseHas('products', [
            'id' => $otherProduct->id,
            'deleted_at' => null,
        ]);
    }

    public function test_buyer_cannot_archive_all_products(): void
    {
        $this->apiAs($this->createUser('buyer'))
            ->deleteJson('/api/v1/products')
            ->assertForbidden();
    }

    public function test_buyer_can_filter_paginated_products_and_favorite_one(): void
    {
        $buyer = $this->createUser('buyer');
        $producer = $this->createUser('producer');
        $product = Product::create([
            'producer_id' => $producer->id,
            'name' => 'Tomate bio',
            'category' => 'legumes',
            'quantity' => 10,
            'unit' => 'kg',
            'price_per_unit' => 700,
            'location' => 'Cotonou',
            'status' => 'available',
            'expires_at' => Carbon::now()->addDay(),
        ]);

        $this->apiAs($buyer)->getJson('/api/v1/products?search=Tomate&category=legumes&per_page=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', $product->id)
            ->assertJsonPath('meta.per_page', 1);

        $this->apiAs($buyer)->postJson('/api/v1/products/' . $product->id . '/favorite')
            ->assertOk();
        $this->apiAs($buyer)->postJson('/api/v1/products/' . $product->id . '/favorite')
            ->assertOk();

        $this->assertDatabaseCount('product_favorites', 1);
        $this->apiAs($buyer)->getJson('/api/v1/favorites')
            ->assertOk()
            ->assertJsonPath('data.0.id', $product->id);
    }

    public function test_expired_product_is_excluded_and_can_be_restored_only_when_valid(): void
    {
        $producer = $this->createUser('producer');
        $product = Product::create([
            'producer_id' => $producer->id,
            'name' => 'Produit expiré',
            'quantity' => 10,
            'unit' => 'kg',
            'price_per_unit' => 700,
            'location' => 'Cotonou',
            'status' => 'available',
            'expires_at' => Carbon::now()->subDay(),
        ]);

        $this->apiAs($this->createUser('buyer'))->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $product->delete();
        $product->update(['expires_at' => Carbon::now()->addDay()]);

        $this->apiAs($producer)->postJson('/api/v1/products/' . $product->id . '/restore')
            ->assertOk()
            ->assertJsonPath('data.status', 'available');
    }

    public function test_buyer_can_review_a_delivered_product_once(): void
    {
        $buyer = $this->createUser('buyer');
        $producer = $this->createUser('producer');
        $product = Product::create([
            'producer_id' => $producer->id,
            'name' => 'Riz local',
            'quantity' => 10,
            'unit' => 'sac',
            'price_per_unit' => 12000,
            'location' => 'Porto-Novo',
            'status' => 'available',
        ]);
        $order = \App\Models\Order::create([
            'buyer_id' => $buyer->id,
            'product_id' => $product->id,
            'quantity_ordered' => 1,
            'total_price' => 12000,
            'delivery_fees' => 1800,
            'status' => 'delivered',
        ]);

        $this->apiAs($buyer)->postJson('/api/v1/products/' . $product->id . '/reviews', [
            'order_id' => $order->id,
            'rating' => 5,
            'comment' => 'Très bon produit',
        ])->assertCreated();

        $this->apiAs($buyer)->postJson('/api/v1/products/' . $product->id . '/reviews', [
            'order_id' => $order->id,
            'rating' => 4,
        ])->assertStatus(409);
    }

    public function test_buyer_and_producer_cannot_update_driver_gps(): void
    {
        foreach (['buyer', 'producer'] as $role) {
            $this->apiAs($this->createUser($role))
                ->postJson('/api/v1/driver/ping', [
                    'latitude' => 6.3703,
                    'longitude' => 2.3912,
                    'status' => 'available',
                ])->assertForbidden();
        }
    }

    private function createUser(string $role): User
    {
        return User::factory()->create([
            'name' => ucfirst($role),
            'last_name' => 'Test',
            'phone' => '980' . fake()->unique()->numerify('######'),
            'email' => $role . '.' . fake()->unique()->safeEmail(),
            'role' => $role,
            'status' => 'active',
        ]);
    }

    private function apiAs(User $user): static
    {
        return $this->withToken(Auth::guard('api')->login($user));
    }
}