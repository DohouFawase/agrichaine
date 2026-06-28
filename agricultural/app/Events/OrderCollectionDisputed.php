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

class OrderCollectionDisputed
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    public function __construct(Order $order)
    {
        $this->order = $order->load(['driver', 'product']);
    }

    public function broadcastOn(): array
    {
        // 🔒 Notifie l'acheteur ciblé
        return [
            new PrivateChannel('App.Models.User.' . $this->order->buyer_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.collection_disputed';
    }
}
