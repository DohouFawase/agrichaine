<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    //
    use HasUuids;

    protected $fillable = [
        'order_id', 
        'payment_reference', 
        'amount', 
        'status'
    ];

    /**
     * La transaction est rattachée à une commande spécifique.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
