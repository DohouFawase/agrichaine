<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;


class LoyaltyTie extends Model
{
    //
    use HasUuids;

    protected $fillable = [
        'name',
        'badge_slug',
        'rank',
        'min_volume',
        'min_orders',
        'period_days',
        'grants_recurring_purchases',
        'is_active',
    ];

    protected $casts = [
        'grants_recurring_purchases' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function statuses(): HasMany
    {
        return $this->hasMany(CustomerLoyaltyStatus::class, 'current_tier_id');
    }
}
