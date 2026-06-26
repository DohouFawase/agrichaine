<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Trip extends Model
{
    //
    use HasUuids;

    protected $fillable = [
        'transporter_id', 
        'departure_city', 
        'destination_city', 
        'available_weight', 
        'departure_date', 
        'status'
    ];

    /**
     * Le trajet appartient à un chauffeur (User).
     */
    public function transporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'transporter_id');
    }
}
