<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class NewOrderPlaced extends Notification
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
        $order->loadMissing(['product.producer', 'buyer']);

        $this->orderData = [
            'id'                => $order->id,
            'product_id'        => $order->product?->id,
            'product_name'      => $order->product?->name ?? 'Produit vivrier',
            'quantity_ordered'  => $order->quantity_ordered,
            'unit'              => $order->product?->unit,
            'total_price'       => $order->total_price,
            'delivery_fees'     => $order->delivery_fees,
            'status'            => $order->status,
            'buyer_id'          => $order->buyer?->id,
            'buyer_name'        => $order->buyer?->name ?? 'Un acheteur',
            'producer_id'       => $order->product?->producer?->id,
            'producer_name'     => $order->product?->producer?->name ?? 'Un producteur',
            'delivery_address'  => $order->delivery_address_name,
            'delivery_latitude' => $order->delivery_latitude,
            'delivery_longitude' => $order->delivery_longitude,
            'created_at'        => $order->created_at?->toIso8601String() ?? now()->toIso8601String(),
        ];
    }


    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Données stockées en base.
     * Le message change selon le rôle du destinataire (producer ou transporter).
     */

    public function toDatabase($notifiable): array
    {
        $isProducer = $notifiable->role === 'producer';

        $title = $isProducer
            ? 'Nouvelle commande reçue'
            : 'Nouvelle course disponible';

        $message = $isProducer
            ? sprintf(
                '%s a commandé %s %s de %s.',
                $this->orderData['buyer_name'],
                $this->orderData['quantity_ordered'],
                $this->orderData['unit'] ?? 'unité(s)',
                $this->orderData['product_name']
            )
            : sprintf(
                'Une nouvelle livraison est disponible depuis %s vers %s.',
                $this->orderData['producer_name'],
                $this->orderData['delivery_address'] ?? 'une destination'
            );

        return [
            'type'                => 'order.created',
            'title'               => $title,
            'message'             => $message,
            'order_id'            => $this->orderData['id'],
            'product_id'          => $this->orderData['product_id'],
            'product_name'        => $this->orderData['product_name'],
            'quantity_ordered'    => $this->orderData['quantity_ordered'],
            'unit'                => $this->orderData['unit'],
            'total_price'         => $this->orderData['total_price'],
            'delivery_fees'       => $this->orderData['delivery_fees'],
            'status'              => $this->orderData['status'],
            'buyer'               => [
                'id'   => $this->orderData['buyer_id'],
                'name' => $this->orderData['buyer_name'],
            ],
            'producer'            => [
                'id'   => $this->orderData['producer_id'],
                'name' => $this->orderData['producer_name'],
            ],
            'delivery_address'    => $this->orderData['delivery_address'],
            'delivery_latitude'   => $this->orderData['delivery_latitude'],
            'delivery_longitude'  => $this->orderData['delivery_longitude'],
            'order_created_at'    => $this->orderData['created_at'],
        ];
    }


    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray($notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
