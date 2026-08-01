<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
 

class RecurringOrder extends Model
{
    //
    use HasUuids;

    protected $fillable = [
        'buyer_id',
        'product_id',
        'quantity',
        'frequency',
        'next_run_at',
        'status',
        'delivery_latitude',
        'delivery_longitude',
        'delivery_address_name',
        'last_executed_at',
        'last_order_id',
    ];

    protected $casts = [
        'next_run_at' => 'datetime',
        'last_executed_at' => 'datetime',
        'quantity' => 'float',
    ];

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function lastOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'last_order_id');
    }

    /**
     * Calcule la prochaine date d'exécution à partir de maintenant,
     * selon la fréquence choisie.
     */
    public function computeNextRunAt(): \Carbon\Carbon
    {
        return match ($this->frequency) {
            'weekly' => now()->addWeek(),
            'biweekly' => now()->addWeeks(2),
            'monthly' => now()->addMonth(),
        };
    }
}
