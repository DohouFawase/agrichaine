<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\OrderTracking;

class DriverLocationUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $tracking;
    public $buyerId;

    public function __construct(OrderTracking $tracking, string $buyerId)
    {
        $this->tracking = $tracking;
        $this->buyerId = $buyerId;
    }

    public function broadcastOn(): array
    {
        // On envoie la position sur le canal privé de l'acheteur
        return [new PrivateChannel('App.Models.User.' . $this->buyerId)];
    }

    public function broadcastAs(): string
    {
        return 'driver.location_updated';
    }
}
