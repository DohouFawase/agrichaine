<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Product extends Model
{
    //
    use HasUuids;

    protected $fillable = [
        'producer_id', 
        'name', 
        'quantity', 
        'unit', 
        'price_per_unit', 
        'location', 
        'status'
    ];

    /**
     * Le produit appartient à un producteur spécifique (User).
     */
    public function producer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'producer_id');
    }

    /**
     * Un produit peut faire l'objet de plusieurs commandes.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
