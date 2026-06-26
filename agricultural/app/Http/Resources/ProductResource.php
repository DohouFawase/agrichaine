<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'name' => $this->name,
            'quantity' => (float) $this->quantity,
            'unit' => $this->unit,
            'price_per_unit' => (int) $this->price_per_unit,
            'total_estimated_value' => (int) ($this->quantity * $this->price_per_unit), // Petit bonus pratique pour le front
            'location' => $this->location,
            'status' => $this->status,
            'producer' => new UserResource($this->whenLoaded('producer')), // Charge le producteur si demandé
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
