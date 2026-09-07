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
            'reserved_quantity' => (float) ($this->reserved_quantity ?? 0),
            'available_quantity' => (float) (($this->quantity ?? 0) - ($this->reserved_quantity ?? 0)),
            'unit' => $this->unit,
            'price_per_unit' => (int) $this->price_per_unit,
            'total_estimated_value' => (int) ($this->quantity * $this->price_per_unit), // Petit bonus pratique pour le front
            'location' => $this->location,
            'status' => $this->status,
            'category' => $this->category,
            'category_id' => $this->category_id,
            'category_details' => $this->whenLoaded('categoryRelation', function () {
                return [
                    'id' => $this->categoryRelation->id,
                    'name' => $this->categoryRelation->name,
                    'slug' => $this->categoryRelation->slug,
                ];
            }),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'stock_proof_photo_path' => $this->stock_proof_photo_path,
            'average_rating' => (float) ($this->reviews_avg_rating ?? 0),
            'reviews_count' => (int) ($this->reviews_count ?? 0),
            'is_favorite' => (bool) ($this->is_favorite ?? false),
            'producer' => new UserResource($this->whenLoaded('producer')), // Charge le producteur si demandé
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
