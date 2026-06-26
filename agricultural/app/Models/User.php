<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasUuids;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $fillable = ['name', 'phone', 'last_name', 'email', 'role', 'status', 'password'];

    /**
     * Un producteur possède plusieurs produits en vente.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'producer_id');
    }

    /**
     * Un chauffeur possède plusieurs trajets déclarés.
     */
    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'transporter_id');
    }

    /**
     * Un acheteur possède plusieurs commandes passées.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'buyer_id');
    }

    /**
     * Un chauffeur peut être assigné à la livraison de plusieurs commandes.
     */
    public function deliveries(): HasMany
    {
        return $this->hasMany(Order::class, 'transporter_id');
    }

    public function getJWTIdentifier()
    {
        return $this->getKey(); // Retourne l'UUID de l'utilisateur
    }

    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role, // Pratique : le rôle est directement encodé dans le token
        ];
    }

    public function driverStatus()
    {
        return $this->hasOne(DriverStatus::class, 'user_id');
    }

    /**
     * Récupérer le portefeuille de l'utilisateur
     */
    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    /**
     * Récupérer directement toutes les transactions financières de l'utilisateur
     */
    public function walletTransactions()
    {
        return $this->hasManyThrough(WalletTransaction::class, Wallet::class);
    }
}
