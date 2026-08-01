<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class CustomerLoyaltyStatus extends Model
{
    //
    use HasUuids;

    protected $fillable = [
        'buyer_id',
        'producer_id',
        'current_tier_id',
        'rolling_volume',
        'rolling_orders_count',
        'period_start',
        'last_evaluated_at',
        'best_client_notified_at',
        'recurring_purchases_enabled',
    ];

    protected $casts = [
        'period_start' => 'datetime',
        'last_evaluated_at' => 'datetime',
        'best_client_notified_at' => 'datetime',
        'recurring_purchases_enabled' => 'boolean',
    ];

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    public function producer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'producer_id');
    }

    public function currentTier(): BelongsTo
    {
        return $this->belongsTo(LoyaltyTier::class, 'current_tier_id');
    }
}
