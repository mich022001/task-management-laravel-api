<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use PHPOpenSourceSaver\JWTAuth\JWTGuard;

class AuthController extends Controller
{
    /**
     * Authenticate a user and issue a JWT.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        /** @var JWTGuard $guard */
        $guard = auth('api');

        if (! $token = $guard->attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        $user = $guard->user();

        if (! $user->is_active) {
            $guard->logout();

            return response()->json([
                'message' => 'Your account is inactive.',
            ], 403);
        }

        return $this->tokenResponse(
            token: $token,
            message: 'Login successful.',
        );
    }

    /**
     * Return the currently authenticated user.
     */
    public function me(): JsonResponse
    {
        /** @var JWTGuard $guard */
        $guard = auth('api');

        return response()->json([
            'message' => 'Authenticated user retrieved successfully.',
            'data' => [
                'user' => new UserResource($guard->user()),
            ],
        ]);
    }

    /**
     * Invalidate the current JWT.
     */
    public function logout(): JsonResponse
    {
        /** @var JWTGuard $guard */
        $guard = auth('api');

        $guard->logout();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }

    /**
     * Refresh the current JWT.
     */
    public function refresh(): JsonResponse
    {
        /** @var JWTGuard $guard */
        $guard = auth('api');

        $token = $guard->refresh();

        return $this->tokenResponse(
            token: $token,
            message: 'Token refreshed successfully.',
        );
    }

    /**
     * Build the standard authentication response.
     */
    private function tokenResponse(string $token, string $message): JsonResponse
    {
        /** @var JWTGuard $guard */
        $guard = auth('api');

        return response()->json([
            'message' => $message,
            'data' => [
                'user' => new UserResource($guard->user()),
                'access_token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => $guard->factory()->getTTL() * 60,
            ],
        ]);
    }
}
