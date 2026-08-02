<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    /**
     * Send a password-reset link without exposing account existence.
     */
    public function sendResetLink(
        ForgotPasswordRequest $request,
    ): JsonResponse {
        Password::broker()->sendResetLink(
            $request->safe()->only('email'),
        );

        return response()->json([
            'message' => 'If an account exists for that email address, a password reset link has been sent.',
        ]);
    }

    /**
     * Reset the user's password using a valid broker token.
     */
    public function reset(
        ResetPasswordRequest $request,
    ): JsonResponse {
        $credentials = $request->safe()->only([
            'email',
            'password',
            'password_confirmation',
            'token',
        ]);

        $status = Password::broker()->reset(
            $credentials,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => match ($status) {
                    Password::INVALID_TOKEN => 'This password reset link is invalid or has expired.',
                    Password::INVALID_USER => 'The password reset request could not be completed.',
                    default => 'The password reset request could not be completed.',
                },
                'errors' => [
                    'email' => [
                        'The password reset request could not be completed.',
                    ],
                ],
            ], 422);
        }

        return response()->json([
            'message' => 'Password reset successfully.',
        ]);
    }
}
