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

class OrderCollected
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    public function __construct(Order $order)
    {
        $this->order = $order->load(['driver', 'product']);
    }

    public function broadcastOn(): array
    {
        // 🔒 On utilise le canal par défaut de l'utilisateur (l'acheteur) pour le toucher personnellement
        return [
            new PrivateChannel('App.Models.User.' . $this->order->buyer_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.collected';
    }
}
