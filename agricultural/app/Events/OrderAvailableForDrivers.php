<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderAvailableForDrivers
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;
    public $zone;

    /**
     * Create a new event instance.
     * 
     * @param Order $order
     * @param string $zone
     */
    public function __construct(Order $order, string $zone)
    {
        // On s'assure que les relations clés sont chargées pour le payload
        $this->order = $order->load(['buyer', 'product.producer']);
        $this->zone = $zone;
    }

    /**
     * Get the channels the event should broadcast on.
     * On ouvre une fréquence radio privée par zone géographique (ex: drivers.zone.seme-krake)
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('drivers.zone.' . $this->zone),
        ];
    }

    /**
     * Le nom de l'action capté côté React Native (.order.available)
     */
    public function broadcastAs(): string
    {
        return 'order.available';
    }

    /**
     * Personnalisation du colis numérique reçu par l'application mobile du chauffeur
     */
    public function broadcastWith(): array
    {
        return [
            'order_id'       => $this->order->id,
            'product_name'   => $this->order->product->name,
            'quantity'       => $this->order->quantity_ordered,
            'delivery_fees'  => $this->order->delivery_fees, // Frais de livraison qu'il va empocher
            'pickup_zone'    => $this->zone,
            'producer_name'  => $this->order->product->producer->name,
            'buyer_name'     => $this->order->buyer->name,
            'created_at'     => $this->order->created_at->toIso8601String(),
        ];
    }
}
