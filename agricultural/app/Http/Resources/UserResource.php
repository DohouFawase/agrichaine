<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing('wallet');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'last_name' => $this->last_name,
            'role' => $this->role,
            'status' => $this->status,
            'wallet_balance' => (float) ($this->wallet?->balance ?? 0),
            'wallet_currency' => $this->wallet?->currency ?? 'XOF',
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
