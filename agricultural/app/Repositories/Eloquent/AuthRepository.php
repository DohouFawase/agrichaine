<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\AuthRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;

class AuthRepository implements AuthRepositoryInterface
{
    protected $model;

    public function __construct(User $model)
    {
        $this->model = $model;
    }

    public function register(array $data)
    {
        // On utilise une transaction DB pour l'atomicité de l'opération
        return DB::transaction(function () use ($data) {

            // 1. Hachage du mot de passe
            $data['password'] = Hash::make($data['password']);

            // 2. Création de l'utilisateur
            $user = $this->model->create($data);

            // 3. Création automatique du portefeuille lié à l'UUID de l'utilisateur
            Wallet::create([
                'user_id'  => $user->id,
                'balance'  => 0, // Solde initial à 0 XOF
                'currency' => 'XOF',
            ]);

            return $user;
        });
    }

    public function login(array $credentials)
    {
        // Tente de connecter l'utilisateur avec son phone et password. Retourne le token JWT ou false.
        if (! $token = Auth::guard('api')->attempt($credentials)) {
            return null;
        }

        return $token;
    }

    public function logout()
    {
        Auth::guard('api')->logout();
    }
}
