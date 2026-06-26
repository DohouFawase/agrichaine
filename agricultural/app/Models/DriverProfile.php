<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    use HasUuids;

    protected $fillable = ['user_id', 'latitude', 'longitude', 'status'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}