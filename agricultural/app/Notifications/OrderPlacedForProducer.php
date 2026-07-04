<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

/**
 * ⚠️ Remplace App\Events\OrderPlacedForProducer.
 *
 * Avant : un Event pur (ShouldBroadcast) → temps réel uniquement, RIEN
 * n'était enregistré dans la table `notifications`, donc l'écran de liste
 * des notifications du producteur restait vide pour ce type d'évènement.
 *
 * Maintenant : une vraie Notification Laravel avec via() => ['database',
 * 'broadcast'] → persistée en base (alimente NotificationController::index
 * / unreadCount) ET diffusée en temps réel sur le canal privé user.{id}
 * (alimente le badge instantané côté app mobile via Echo).
 */
class OrderPlacedForProducer extends Notification implements ShouldQueue
{
    use Queueable;

    public Order $order;

    public function __construct(Order $order)
    {
        $this->order = ($order->relationLoaded('product') && $order->product?->relationLoaded('producer'))
            ? $order
            : $order->load(['buyer', 'product.producer']);
    }

    /**
     * 'database' → persistance dans la table notifications (colonne data)
     * 'broadcast' → diffusion Reverb en temps réel
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Payload persisté en base. Sa forme correspond exactement au type
     * NotificationData attendu côté app mobile (title, message,
     * product_id, quantity, price, stock_proof_photo_path, producer,
     * product_created_at) — voir notificationsProvideraction.ts.
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type'                   => 'order_placed',
            'title'                  => 'Nouvelle commande reçue',
            'message'                => $this->buildMessage(),
            'order_id'               => $this->order->id,
            'product_id'             => $this->order->product?->id,
            'quantity'               => $this->order->quantity_ordered,
            'price'                  => $this->order->total_price,
            'stock_proof_photo_path' => null,
            'producer'               => [
                'id'   => $this->order->product?->producer_id,
                'name' => $this->order->product?->producer?->name,
            ],
            'product_created_at'     => optional($this->order->product?->created_at)?->toIso8601String(),
        ];
    }

    /**
     * Canal privé de diffusion temps réel — identique à celui de l'ancien
     * Event, pour ne rien casser côté écoute Echo dans l'app mobile.
     */
    public function broadcastOn(): array
    {
        $producerId = $this->order->product?->producer_id;

        return $producerId ? [new PrivateChannel('user.' . $producerId)] : [];
    }

    /**
     * Nom de l'évènement côté client Echo : `.order.placed`
     * (par défaut Laravel utiliserait `.notification`, on le personnalise
     * pour matcher exactement ce qu'écoutait l'ancien Event).
     */
    public function broadcastType(): string
    {
        return 'order.placed';
    }

    /**
     * Contenu du message temps réel — volontairement léger, l'app mobile
     * peut ensuite refetch le détail complet via fetchNotificationDetail
     * si besoin (comme pour les notifs du canal marketplace.buyers).
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'order_id'   => $this->order->id,
            'product_id' => $this->order->product?->id,
            'title'      => 'Nouvelle commande reçue',
            'message'    => $this->buildMessage(),
            'created_at' => now()->toIso8601String(),
        ]);
    }

    private function buildMessage(): string
    {
        return sprintf(
            '%s a commandé %s unité(s) de %s.',
            $this->order->buyer?->name ?? 'Un acheteur',
            $this->order->quantity_ordered,
            $this->order->product?->name ?? 'produit'
        );
    }
}