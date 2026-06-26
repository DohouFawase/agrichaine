<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    use HasUuids;
    //
    protected $fillable = [
        'wallet_id',
        'amount',
        'type',
        'reference',
        'description'
    ];

    /**
     * Relation : Une transaction appartient à un seul portefeuille
     */
    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

}
