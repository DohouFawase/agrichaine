<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Product;

class ProductPublished implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */

    public $product;


    public function __construct(Product $product)
    {
        //
        $this->product = $product->load('user');
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'product.created';
    }

    /**
     * Optionnel : Personnaliser exactement les données transmises à Reverb.
     * Ici, on s'assure d'envoyer les données brutes ou un tableau propre du produit.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->product->id,
            'name' => $this->product->name,
            'quantity' => $this->product->quantity,
            'price' => $this->product->price,
            'stock_proof_photo_path' => $this->product->stock_proof_photo_path,
            'producer' => [
                'id' => $this->product->producer->id,
                'name' => $this->product->producer->name,
            ],
            'created_at' => $this->product->created_at->toIso8601String(),
        ];
    }
}
