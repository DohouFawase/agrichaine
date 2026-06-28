<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/**
 * 1. Canal d'authentification par défaut de Laravel
 * Sécurisé pour s'assurer qu'un utilisateur n'écoute que ses propres notifications privées.
 */
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * 2. Canal d'alerte pour le catalogue des Acheteurs (Commerçantes)
 * Notifie les acheteurs dès qu'un produit est publié sur Onabaya.
 */
Broadcast::channel('marketplace.buyers', function ($user) {
    return $user->role === 'buyer';
});

/**
 * 3. Canal privé individuel pour les Vendeurs (Producteurs)
 * Notifie le vendeur ciblé dès qu'une commerçante achète sa récolte.
 */
Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * 4. Canal privé sectorisé pour le Radar des Chauffeurs (Transporteurs)
 * Diffuse les offres de livraison uniquement aux chauffeurs actifs dans la zone du champ.
 */
Broadcast::channel('drivers.zone.{zone}', function ($user, string $zone) {
    return $user->role === 'driver';
});