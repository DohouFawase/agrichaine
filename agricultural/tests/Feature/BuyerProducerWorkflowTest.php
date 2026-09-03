<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
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