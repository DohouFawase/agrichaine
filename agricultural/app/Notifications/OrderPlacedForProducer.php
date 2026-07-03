<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
class OrderPlacedForProducer extends Notification
{
    use Queueable;

    // On stocke un tableau de données brutes au lieu du modèle Eloquent
    protected array $orderData;

    /**
     * Create a new notification instance.
     */
    public function __construct(Order $order)
    {
        // On extrait les données immédiatement au moment du dispatching.
        // Plus aucun risque de mauvaise désérialisation en tâche de fond !
        $order->loadMissing(['buyer', 'product']);

        $this->orderData = [
            'id'               => $order->id,
            'product_id'       => $order->product?->id,
            'product_name'     => $order->product?->name ?? 'Produit vivrier',
            'quantity_ordered' => $order->quantity_ordered,
            'total_price'      => $order->total_price,
            'delivery_fees'    => $order->delivery_fees,
            'status'           => $order->status,
            'buyer_id'         => $order->buyer?->id,
            'buyer_name'       => $order->buyer?->name ?? 'Un acheteur',
            'created_at'       => $order->created_at?->toIso8601String() ?? now()->toIso8601String(),
        ];
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Données stockées en base.
     */
    public function toDatabase($notifiable): array
    {
        return [
            'type'             => 'order.placed',
            'title'            => 'Nouvelle commande reçue',
            'message'          => sprintf(
                '%s vient de commander %s unité(s) de %s.',
                $this->orderData['buyer_name'],
                $this->orderData['quantity_ordered'],
                $this->orderData['product_name']
            ),
            'order_id'         => $this->orderData['id'],
            'product_id'       => $this->orderData['product_id'],
            'product_name'     => $this->orderData['product_name'],
            'quantity_ordered' => $this->orderData['quantity_ordered'],
            'total_price'      => $this->orderData['total_price'],
            'delivery_fees'    => $this->orderData['delivery_fees'],
            'status'           => $this->orderData['status'],
            'buyer'            => [
                'id'   => $this->orderData['buyer_id'],
                'name' => $this->orderData['buyer_name'],
            ],
            'order_created_at' => $this->orderData['created_at'],
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    public function toArray($notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
