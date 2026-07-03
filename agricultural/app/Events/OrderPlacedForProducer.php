<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Order;

class OrderPlacedForProducer implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order->load(['buyer', 'product']);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        // 🔒 Canal privé unique basé sur l'ID du producteur/vendeur du produit acheté
        return [
            new PrivateChannel('user.' . $this->order->product->producer_id),
        ];
    }

    /**
     * Nom de l'événement capté côté React Native
     */
    public function broadcastAs(): string
    {
        return 'order.placed';
    }

    /**
     * Personnalisation du colis numérique reçu par l'application mobile du producteur
     */
    public function broadcastWith(): array
    {
        return [
            'order_id'         => $this->order->id,
            'product_id'       => $this->order->product->id,
            'product_name'     => $this->order->product->name,
            'quantity_ordered' => $this->order->quantity_ordered,
            'total_price'      => $this->order->total_price,
            'delivery_fees'    => $this->order->delivery_fees,
            'status'           => $this->order->status,
            'buyer_name'       => $this->order->buyer->name,
            'title'            => 'Nouvelle commande reçue',
            'message'          => sprintf(
                '%s a commandé %s unité(s) de %s.',
                $this->order->buyer->name,
                $this->order->quantity_ordered,
                $this->order->product->name
            ),
            'created_at'       => $this->order->created_at->toIso8601String(),
        ];
    }
}