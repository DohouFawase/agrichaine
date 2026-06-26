<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TripResource extends JsonResource
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
            'departure_city' => $this->departure_city,
            'destination_city' => $this->destination_city,
            'available_weight' => (int) $this->available_weight,
            'departure_date' => $this->departure_date->toIso8601String(),
            'status' => $this->status,
            'transporter' => new UserResource($this->whenLoaded('transporter')),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
