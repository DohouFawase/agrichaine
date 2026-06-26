<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DriverStatus extends Model
{
    protected $table = 'driver_statuses';

    protected $fillable = [
        'user_id',
        'latitude',
        'longitude',
        'status',
        'last_ping_at'
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'last_ping_at' => 'datetime',
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

    // Relation : Le statut appartient à un utilisateur (qui est un transporter)
    public function transporter()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
