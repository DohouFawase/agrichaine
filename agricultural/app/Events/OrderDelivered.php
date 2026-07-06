<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderDelivered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Order $order;

    public function __construct(Order $order)
    {
        // On charge ce dont on a besoin pour notifier le producteur ET le transporteur
        $this->order = $order->load(['transporter', 'product.producer']);
    }

    /**
     * Canaux privés : le producteur et le transporteur doivent être notifiés
     * que les fonds ont été libérés sur leur wallet respectif.
     */
    public function broadcastOn(): array
    {
        $channels = [];

        if ($this->order->transporter_id) {
            $channels[] = new PrivateChannel('user.' . $this->order->transporter_id);
        }

        if ($this->order->product?->producer_id) {
            $channels[] = new PrivateChannel('user.' . $this->order->product->producer_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'order.delivered';
    }

    /**
     * Payload minimal envoyé aux clients connectés (mobile producteur/transporteur).
     */
    public function broadcastWith(): array
    {
        return [
            'order_id'      => $this->order->id,
            'status'        => $this->order->status,
            'delivered_at'  => $this->order->delivered_at,
            'total_price'   => $this->order->total_price,
            'delivery_fees' => $this->order->delivery_fees,
            'message'       => 'Livraison confirmée. Les fonds ont été libérés.',
        ];
    }
}