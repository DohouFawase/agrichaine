<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Repositories\Contracts\AuthRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;;
use Illuminate\Http\Request;
use App\Models\EmailVerificationCode;
use App\Models\User;
use App\Notifications\EmailVerificationOtp;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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
        $this->sendVerificationCode($user);

        return response()->json([
            'success' => true,
            'message' => 'Inscription réussie. Vérifiez votre adresse email avant de vous connecter.',
            'data' => ['user' => new UserResource($user)],
        ], 201);
    }

    /**
     * Connexion via numéro de téléphone et mot de passe
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $token = $this->authRepository->login($request->validated());

        if (is_array($token) && ($token['unverified'] ?? false)) {
            return response()->json([
                'success' => false,
                'message' => 'Votre adresse email doit être vérifiée avant la connexion.',
                'email_verification_required' => true,
            ], 403);
        }

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
     * Récupération de l'utilisateur actuellement connecté
     */
    public function me(): JsonResponse
    {
        return response()->json(
            (new UserResource($this->authRepository->me()))->resolve()
        );
    }

    public function verifyEmailOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
        ]);
        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Code de vérification invalide.'], 422);
        }

        $verification = EmailVerificationCode::where('user_id', $user->id)
            ->whereNull('used_at')
            ->latest()
            ->first();

        if (! $verification || $verification->expires_at->isPast() || $verification->attempts >= 5) {
            return response()->json(['success' => false, 'message' => 'Code expiré ou nombre maximal d’essais atteint.'], 422);
        }

        $verification->increment('attempts');

        if (! Hash::check($data['code'], $verification->code_hash)) {
            return response()->json(['success' => false, 'message' => 'Code de vérification invalide.'], 422);
        }

        DB::transaction(function () use ($user, $verification) {
            $verification->update(['used_at' => now()]);
            $user->markEmailAsVerified();
        });

        return response()->json([
            'success' => true,
            'message' => 'Adresse email vérifiée. Vous pouvez maintenant vous connecter.',
        ]);
    }

    public function resendVerification(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = \App\Models\User::where('email', $data['email'])->first();

        if ($user && ! $user->hasVerifiedEmail()) {
            $this->sendVerificationCode($user);
        }

        return response()->json([
            'success' => true,
            'message' => 'Si ce compte existe et n’est pas vérifié, un nouvel email a été envoyé.',
        ]);
    }

    private function sendVerificationCode(User $user): void
    {
        EmailVerificationCode::where('user_id', $user->id)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        $code = Str::padLeft((string) random_int(0, 999999), 6, '0');

        EmailVerificationCode::create([
            'user_id' => $user->id,
            'code_hash' => Hash::make($code),
            'expires_at' => now()->addMinutes(10),
        ]);

        $user->notify(new EmailVerificationOtp($code));
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
