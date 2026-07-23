<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class MomoTransaction extends Model
{
    //
        use HasUuids;
 
    protected $fillable = [
        'user_id',
        'order_id',
        'type',
        'external_reference',
        'phone',
        'amount',
        'currency',
        'status',
        'momo_status',
        'processed_at',
    ];
 
    protected $casts = [
        'processed_at' => 'datetime',
    ];
 
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
 
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

}
