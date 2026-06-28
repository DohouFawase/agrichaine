<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Order;

class OrderPlacedForProducer
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;


    /**
     * Create a new event instance.
     */
    /**
     * Create a new event instance.
     */
    public function __construct(Order $order)
    {
        // Corrigé la variable $this et la faute sur 'order'
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
}
