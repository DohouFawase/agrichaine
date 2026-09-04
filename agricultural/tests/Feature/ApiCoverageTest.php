<?php

namespace Tests\Feature;

use App\Models\DriverProfile;
use App\Models\Order;
use App\Models\OrderTracking;
use App\Models\Product;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Tests\TestCase;

class ApiCoverageTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_login(): void
    {
        $registration = $this->postJson('/api/v1/auth/register', [
            'name' => 'Awa',
            'last_name' => 'Test',
            'email' => 'awa@example.com',
            'phone' => '+22990000099',
            'role' => 'buyer',
            'password' => 'password',
        ]);

        $registration->assertCreated()->assertJsonPath('data.user.role', 'buyer');
        $this->assertDatabaseHas('wallets', ['user_id' => $registration->json('data.user.id')]);

        $this->postJson('/api/v1/auth/login', [
            'phone' => '+22990000099',
            'password' => 'password',
        ])->assertOk()->assertJsonStructure(['data' => ['access_token']]);
    }

    public function test_protected_api_requires_authentication(): void
    {
        $this->getJson('/api/v1/home')->assertUnauthorized();
        $this->getJson('/api/v1/products')->assertUnauthorized();
        $this->getJson('/api/v1/balance')->assertUnauthorized();
    }

    public function test_wallet_deposit_and_summary_are_available_to_buyer(): void
    {
        $buyer = $this->createUser('buyer');
        Wallet::create(['user_id' => $buyer->id, 'balance' => 0, 'currency' => 'XOF']);

        $this->apiAs($buyer)->postJson('/api/v1/deposit', [
            'amount' => 5000,
            'transaction_reference' => 'DEP-' . Str::uuid(),
        ])->assertOk()->assertJsonPath('new_balance', 5000);

        $this->apiAs($buyer)->getJson('/api/v1/balance')
            ->assertOk()
            ->assertJsonPath('data.balance', 5000)
            ->assertJsonPath('data.currency', 'XOF');
    }

    public function test_transporter_can_create_and_list_a_trip(): void
    {
        $transporter = $this->createUser('transporter');

        $this->apiAs($transporter)->postJson('/api/v1/trips', [
            'departure_city' => 'Abomey',
            'destination_city' => 'Cotonou',
            'available_weight' => 100,
            'departure_date' => now()->addDay()->format('Y-m-d H:i:s'),
        ])->assertCreated()->assertJsonPath('data.status', 'scheduled');

        $this->apiAs($transporter)->getJson('/api/v1/trips')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_buyer_and_producer_cannot_create_a_trip(): void
    {
        foreach (['buyer', 'producer'] as $role) {
            $this->apiAs($this->createUser($role))->postJson('/api/v1/trips', [
                'departure_city' => 'Abomey',
                'destination_city' => 'Cotonou',
                'available_weight' => 100,
                'departure_date' => now()->addDay()->format('Y-m-d H:i:s'),
            ])->assertForbidden();
        }
    }

    public function test_transporter_can_update_and_batch_sync_order_tracking(): void
    {
        [$buyer, $producer, $transporter] = $this->createOrderActors();
        $order = Order::create([
            'buyer_id' => $buyer->id,
            'product_id' => $this->createProduct($producer)->id,
            'transporter_id' => $transporter->id,
            'quantity_ordered' => 2,
            'total_price' => 2000,
            'delivery_fees' => 300,
            'status' => 'assigned_to_driver',
        ]);

        $this->apiAs($transporter)->postJson("/api/v1/orders/{$order->id}/tracking", [
            'latitude' => 6.37,
            'longitude' => 2.39,
            'current_city' => 'Cotonou',
        ])->assertOk();

        $this->apiAs($transporter)->postJson("/api/v1/orders/{$order->id}/tracking/batch", [
            'locations' => [[
                'latitude' => 6.38,
                'longitude' => 2.40,
                'current_city' => 'Cotonou',
                'timestamp' => now()->addMinute()->format('Y-m-d H:i:s'),
            ]],
        ])->assertOk();

        $this->apiAs($buyer)->getJson("/api/v1/orders/{$order->id}/tracking")
            ->assertOk()
            ->assertJsonPath('current_position.latitude', 6.38)
            ->assertJsonCount(2, 'full_itinerary');

        $this->assertDatabaseCount('order_trackings', 2);
    }

    private function createOrderActors(): array
    {
        return [$this->createUser('buyer'), $this->createUser('producer'), $this->createUser('transporter')];
    }

    private function createProduct(User $producer): Product
    {
        return Product::create([
            'producer_id' => $producer->id,
            'name' => 'Tomates',
            'quantity' => 20,
            'unit' => 'kg',
            'price_per_unit' => 1000,
            'location' => 'Abomey',
            'status' => 'available',
        ]);
    }

    private function createUser(string $role): User
    {
        return User::factory()->create([
            'name' => ucfirst($role),
            'last_name' => 'Test',
            'phone' => '990' . fake()->unique()->numerify('######'),
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