<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
class Product extends Model
{
    //
    use HasUuids, SoftDeletes;

    protected $fillable = [
        'producer_id', 
        'name', 
        'category',
        'category_id',
        'quantity', 
        'unit', 
        'price_per_unit', 
        'location', 
        'status',
        'stock_proof_photo_path',
        'reserved_quantity',
        'expires_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'quantity' => 'decimal:2',
        'reserved_quantity' => 'decimal:2',
    ];

    /**
     * Le produit appartient à un producteur spécifique (User).
     */
    public function producer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'producer_id');
    }

    public function categoryRelation(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /**
     * Un produit peut faire l'objet de plusieurs commandes.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(ProductFavorite::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }
}
