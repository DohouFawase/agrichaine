<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class OrderTracking extends Model
{
    protected $table = 'order_trackings';

    protected $fillable = [
        'order_id',
        'latitude',
        'longitude',
        'current_city'
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // Relation : Un point de tracking appartient à une commande
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
