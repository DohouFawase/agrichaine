<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    //
    use HasUuids;

    // protected $fillable = [
    //     'buyer_id', 
    //     'product_id', 
    //     'transporter_id', 
    //     'quantity_ordered', 
    //     'total_price', 
    //     'delivery_fees', 
    //     'status'
    // ];

    protected $fillable = [
        'buyer_id', 'driver_id', 'product_id', 'quantity_ordered', 'quantity_collected',
        'total_price', 'delivery_price', 'status', 'verification_code_delivery',
        'transporter_id','delivery_fees', 
        'buyer_dispute_photo_path', 'buyer_dispute_reason', 'escrowed_at', 'delivered_at'
    ];

    /**
     * La commande appartient à un acheteur (User).
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * La commande concerne un produit spécifique.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * La commande est livrée par un chauffeur spécifique (User).
     */
    public function transporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'transporter_id');
    }

    /**
     * Une commande est liée à une seule transaction financière (Séquestre).
     */
    public function transaction(): HasOne
    {
        return $this->hasOne(Transaction::class);
    }

    // Relation vers l'historique des positions sur la carte
public function trackings()
{
    return $this->hasMany(OrderTracking::class, 'order_id')->orderBy('created_at', 'asc');
}


}
