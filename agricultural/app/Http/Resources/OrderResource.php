<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quantity_ordered' => (float) $this->quantity_ordered,
            'total_price' => (int) $this->total_price,
            'delivery_fees' => (int) $this->delivery_fees,
            'status' => $this->status,

            'verification_code_collection' => $this->verification_code_collection,
            'verification_code_delivery' => $this->verification_code_delivery,

            // 🔧 AJOUT : coordonnées de livraison, nécessaires au tracking carte côté acheteur
            'delivery_latitude' => $this->delivery_latitude !== null ? (float) $this->delivery_latitude : null,
            'delivery_longitude' => $this->delivery_longitude !== null ? (float) $this->delivery_longitude : null,
            'pickup_latitude' => $this->pickup_latitude !== null ? (float) $this->pickup_latitude : null,
            'pickup_longitude' => $this->pickup_longitude !== null ? (float) $this->pickup_longitude : null,

            'buyer' => new UserResource($this->whenLoaded('buyer')),
            'producer' => new UserResource($this->whenLoaded('producer')),


            'transporter' => $this->when($this->relationLoaded('transporter') && $this->transporter, function () {
                $lastPoint = $this->trackings()->latest('created_at')->first();

                return [
                    'id' => $this->transporter->id,
                    'name' => $this->transporter->name,
                    'last_name' => $this->transporter->last_name,
                    'phone' => $this->transporter->phone,
                    'average_rating' => $this->transporter->average_rating,
                    'latitude' => $lastPoint?->latitude !== null ? (float) $lastPoint->latitude : null,
                    'longitude' => $lastPoint?->longitude !== null ? (float) $lastPoint->longitude : null,
                ];
            }),

            'product' => new ProductResource($this->whenLoaded('product')),
            'transaction' => new TransactionResource($this->whenLoaded('transaction')),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
