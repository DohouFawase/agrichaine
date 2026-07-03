<?php

namespace App\Notifications;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewProductPublished extends Notification implements ShouldQueue
{
    use Queueable;

    // On stocke un tableau de données brutes au lieu du modèle Eloquent
    protected array $productData;

    /**
     * Create a new notification instance.
     */
    public function __construct(Product $product)
    {
        // On extrait les données immédiatement au moment du dispatching.
        // Plus aucun risque de mauvaise désérialisation en tâche de fond !
        $product->loadMissing('producer');

        $this->productData = [
            'id'                     => $product->id,
            'name'                   => $product->name,
            'quantity'               => $product->quantity,
            'unit'                   => $product->unit,
            'price_per_unit'         => $product->price_per_unit,
            'stock_proof_photo_path' => $product->stock_proof_photo_path,
            'producer_id'            => $product->producer?->id,
            'producer_name'          => $product->producer?->name ?? 'Un producteur',
            'created_at'             => $product->created_at?->toIso8601String() ?? now()->toIso8601String(),
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
            'type'                    => 'product.created',
            'title'                   => 'Nouvelle récolte disponible',
            'message'                 => sprintf(
                '%s vient d\'être publié par %s.',
                $this->productData['name'],
                $this->productData['producer_name']
            ),
            'product_id'              => $this->productData['id'],
            'quantity'                => $this->productData['quantity'],
            'unit'                    => $this->productData['unit'],
            'price_per_unit'          => $this->productData['price_per_unit'],
            'stock_proof_photo_path'  => $this->productData['stock_proof_photo_path'],
            'producer'                => [
                'id'   => $this->productData['producer_id'],
                'name' => $this->productData['producer_name'],
            ],
            'product_created_at'      => $this->productData['created_at'],
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