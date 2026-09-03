<?php

namespace Tests\Feature;

use App\Models\DriverProfile;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class TransportWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_transporter_can_publish_gps_position(): void
    {
        $transporter = $this->createUser('transporter');

        $response = $this->apiAs($transporter)->postJson('/api/v1/driver/ping', [
            'latitude' => 6.3703,
            'longitude' => 2.3912,
            'status' => 'available',
        ]);

        $response->assertOk()->assertJsonPath('data.driver_id', $transporter->id);
        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $transporter->id,
            'status' => 'available',
            'latitude' => 6.3703,
            'longitude' => 2.3912,
        ]);
    }

    public function test_order_is_assigned_to_the_nearest_available_transporter(): void
    {
        [$buyer, $product] = $this->createOrderContext();
        $nearest = $this->createUser('transporter');
        $farther = $this->createUser('transporter');

        DriverProfile::create([
            'user_id' => $nearest->id,
            'latitude' => 6.3705,
            'longitude' => 2.3914,
            'status' => 'available',
        ]);
        DriverProfile::create([
            'user_id' => $farther->id,
            'latitude' => 6.55,
            'longitude' => 2.7,
            'status' => 'available',
        ]);

        $response = $this->apiAs($buyer)->postJson('/api/v1/orders', [
            'product_id' => $product->id,
            'quantity_ordered' => 2,
            'pickup_latitude' => 6.3704,
            'pickup_longitude' => 2.3913,
            'delivery_latitude' => 6.4,
            'delivery_longitude' => 2.45,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'assigned_to_driver')
            ->assertJsonPath('data.transporter.id', $nearest->id);

        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $nearest->id,
            'status' => 'busy',
        ]);
        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $farther->id,
            'status' => 'available',
        ]);
    }

    public function test_qr_collection_and_delivery_release_the_escrowed_payment(): void
    {
        [$buyer, $product] = $this->createOrderContext();
        $transporter = $this->createUser('transporter');
        $producerWallet = Wallet::create(['user_id' => $product->producer_id, 'balance' => 0, 'currency' => 'XOF']);
        $driverWallet = Wallet::create(['user_id' => $transporter->id, 'balance' => 0, 'currency' => 'XOF']);

        DriverProfile::create([
            'user_id' => $transporter->id,
            'latitude' => 6.3703,
            'longitude' => 2.3912,
            'status' => 'available',
        ]);

        $creation = $this->apiAs($buyer)->postJson('/api/v1/orders', [
            'product_id' => $product->id,
            'quantity_ordered' => 2,
            'pickup_latitude' => 6.3703,
            'pickup_longitude' => 2.3912,
            'delivery_latitude' => 6.4,
            'delivery_longitude' => 2.45,
        ])->assertCreated();

        $order = Order::findOrFail($creation->json('data.id'));

        $this->apiAs($transporter)->postJson("/api/v1/orders/{$order->id}/validate-collection", [
            'scanned_code' => $order->verification_code_collection,
            'quantity_collected' => 2,
        ])->assertOk()->assertJsonPath('status', 'collected');

        $this->apiAs($buyer)->postJson("/api/v1/orders/{$order->id}/validate-delivery", [
            'scanned_code' => $order->verification_code_delivery,
        ])->assertOk()->assertJsonPath('status', 'delivered');

        $this->assertSame(2000, (int) $producerWallet->fresh()->balance);
        $this->assertSame(300, (int) $driverWallet->fresh()->balance);
        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $transporter->id,
            'status' => 'available',
        ]);
    }

    private function createOrderContext(): array
    {
        $buyer = $this->createUser('buyer');
        $producer = $this->createUser('producer');

        Wallet::create(['user_id' => $buyer->id, 'balance' => 10000, 'currency' => 'XOF']);
        $product = Product::create([
            'producer_id' => $producer->id,
            'name' => 'Tomates',
            'quantity' => 20,
            'unit' => 'kg',
            'price_per_unit' => 1000,
            'location' => 'Cotonou',
            'status' => 'available',
        ]);

        return [$buyer, $product];
    }

    private function createUser(string $role): User
    {
        return User::factory()->create([
            'name' => ucfirst($role),
            'last_name' => 'Test',
            'phone' => '970' . fake()->unique()->numerify('######'),
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