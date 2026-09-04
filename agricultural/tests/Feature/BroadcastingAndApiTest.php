<?php

namespace Tests\Feature;

use App\Events\DriverLocationUpdated;
use App\Events\OrderAvailableForDrivers;
use App\Events\OrderCollected;
use App\Events\OrderDelivered;
use App\Events\OrderPlacedForProducer;
use App\Events\ProductPublished;
use App\Models\Order;
use App\Models\OrderTracking;
use App\Models\Product;
use App\Models\User;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Broadcast;
use Tests\TestCase;

class BroadcastingAndApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_broadcast_events_target_the_expected_private_channels(): void
    {
        $buyer = $this->createUser('buyer');
        $producer = $this->createUser('producer');
        $transporter = $this->createUser('transporter');
        $product = $this->createProduct($producer);
        $order = Order::create([
            'buyer_id' => $buyer->id,
            'product_id' => $product->id,
            'transporter_id' => $transporter->id,
            'quantity_ordered' => 2,
            'total_price' => 2000,
            'delivery_fees' => 300,
            'status' => 'assigned_to_driver',
        ]);

        $events = [
            new ProductPublished($product),
            new OrderPlacedForProducer($order),
            new OrderDelivered($order),
            new OrderAvailableForDrivers($order, 'Cotonou'),
            new OrderCollected($order),
            new DriverLocationUpdated(new OrderTracking(['order_id' => $order->id]), $buyer->id),
        ];

        foreach ($events as $event) {
            $this->assertInstanceOf(ShouldBroadcast::class, $event);
        }

        $this->assertSame('private-marketplace.buyers', (string) (new ProductPublished($product))->broadcastOn()[0]->name);
        $this->assertSame('private-user.' . $producer->id, (string) (new OrderPlacedForProducer($order))->broadcastOn()[0]->name);
        $this->assertSame('private-drivers.zone.Cotonou', (string) (new OrderAvailableForDrivers($order, 'Cotonou'))->broadcastOn()[0]->name);
        $this->assertSame('private-App.Models.User.' . $buyer->id, (string) (new DriverLocationUpdated(new OrderTracking, $buyer->id))->broadcastOn()[0]->name);
    }

    public function test_product_published_payload_uses_the_product_contract(): void
    {
        $producer = $this->createUser('producer');
        $product = $this->createProduct($producer);

        $payload = (new ProductPublished($product))->broadcastWith();

        $this->assertSame($product->id, $payload['id']);
        $this->assertSame($product->price_per_unit, $payload['price']);
        $this->assertSame($producer->id, $payload['producer']['id']);
        $this->assertSame($producer->name, $payload['producer']['name']);
    }

    public function test_user_channels_authorize_only_the_matching_uuid_and_role(): void
    {
        $buyer = $this->createUser('buyer');
        $transporter = $this->createUser('transporter');
        $channels = Broadcast::getChannels();

        $userChannel = $channels->get('user.{id}');
        $marketplaceChannel = $channels->get('marketplace.buyers');
        $driversChannel = $channels->get('drivers.zone.{zone}');

        $this->assertTrue($userChannel($buyer, $buyer->id));
        $this->assertFalse($userChannel($buyer, $transporter->id));
        $this->assertTrue($marketplaceChannel($buyer));
        $this->assertFalse($marketplaceChannel($transporter));
        $this->assertTrue($driversChannel($transporter, 'Cotonou'));
        $this->assertFalse($driversChannel($buyer, 'Cotonou'));
    }

    public function test_tracking_endpoint_requires_valid_coordinates_and_transporter_access(): void
    {
        $buyer = $this->createUser('buyer');
        $producer = $this->createUser('producer');
        $transporter = $this->createUser('transporter');
        $product = $this->createProduct($producer);
        $order = Order::create([
            'buyer_id' => $buyer->id,
            'product_id' => $product->id,
            'transporter_id' => $transporter->id,
            'quantity_ordered' => 1,
            'total_price' => 1000,
            'delivery_fees' => 100,
            'status' => 'assigned_to_driver',
        ]);

        $this->apiAs($buyer)->postJson("/api/v1/orders/{$order->id}/tracking", [
            'latitude' => 6.37,
            'longitude' => 2.39,
        ])->assertForbidden();

        $this->apiAs($transporter)->postJson("/api/v1/orders/{$order->id}/tracking", [
            'latitude' => 'invalid',
            'longitude' => 2.39,
        ])->assertUnprocessable();

        $this->apiAs($transporter)->postJson("/api/v1/orders/{$order->id}/tracking", [
            'latitude' => 6.37,
            'longitude' => 2.39,
            'current_city' => 'Cotonou',
        ])->assertOk()->assertJsonPath('data.current_city', 'Cotonou');
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

    private function createProduct(User $producer): Product
    {
        return Product::create([
            'producer_id' => $producer->id,
            'name' => 'Tomates',
            'quantity' => 20,
            'unit' => 'kg',
            'price_per_unit' => 1000,
            'location' => 'Cotonou',
            'status' => 'available',
        ]);
    }

    private function apiAs(User $user): static
    {
        return $this->withToken((string) Auth::guard('api')->login($user));
    }
}