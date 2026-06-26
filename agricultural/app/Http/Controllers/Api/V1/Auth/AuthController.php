<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Repositories\Contracts\AuthRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;;

class AuthController extends Controller
{
    //
    protected $authRepository;

    public function __construct(AuthRepositoryInterface $authRepository)
    {
        $this->authRepository = $authRepository;
    }

    /**
     * Inscription d'un nouvel utilisateur (Producteur, Chauffeur ou Acheteur)
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authRepository->register($request->validated());

        // Génération automatique du token juste après l'inscription
        $token = Auth::guard('api')->login($user);

        return $this->respondWithToken($token, $user, 'Inscription réussie.', 201);
    }

    /**
     * Connexion via numéro de téléphone et mot de passe
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $token = $this->authRepository->login($request->validated());

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiants incorrects (numéro de téléphone ou mot de passe).'
            ], 401);
        }

        return $this->respondWithToken($token, Auth::guard('api')->user(), 'Connexion réussie.');
    }

    /**
     * Déconnexion de l'utilisateur (Invalidation du Token)
     */
    public function logout(): JsonResponse
    {
        $this->authRepository->logout();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie.'
        ]);
    }

    /**
     * Structure de réponse standardisée pour le Token JWT
     */
    protected function respondWithToken($token, $user, $message, $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => [
                'user' => new UserResource($user),
                'access_token' => $token,
                'token_type' => 'bearer',
                'expires_in' => Auth::guard('api')->factory()->getTTL() * 60 // Temps d'expiration en secondes
            ]
        ], $statusCode);
    }
}
