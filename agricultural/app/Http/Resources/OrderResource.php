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
            'buyer' => new UserResource($this->whenLoaded('buyer')),
            'producer' => new UserResource($this->whenLoaded('producer')),
            'transporter' => new UserResource($this->whenLoaded('transporter')),
            'product' => new ProductResource($this->whenLoaded('product')),
            'transaction' => new TransactionResource($this->whenLoaded('transaction')),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
