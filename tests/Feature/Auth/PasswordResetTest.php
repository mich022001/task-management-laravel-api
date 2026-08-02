<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_password_reset_link(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'reset@test.com',
        ]);

        $this
            ->postJson('/api/v1/auth/forgot-password', [
                'email' => $user->email,
            ])
            ->assertOk()
            ->assertJsonPath(
                'message',
                'If an account exists for that email address, a password reset link has been sent.',
            );

        Notification::assertSentTo(
            $user,
            ResetPassword::class,
        );
    }

    public function test_unknown_email_receives_same_neutral_response(): void
    {
        Notification::fake();

        $this
            ->postJson('/api/v1/auth/forgot-password', [
                'email' => 'unknown@test.com',
            ])
            ->assertOk()
            ->assertJsonPath(
                'message',
                'If an account exists for that email address, a password reset link has been sent.',
            );

        Notification::assertNothingSent();
    }

    public function test_valid_token_resets_password(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@test.com',
            'password' => 'old-password',
        ]);

        $token = Password::broker()->createToken($user);

        $this
            ->postJson('/api/v1/auth/reset-password', [
                'email' => $user->email,
                'token' => $token,
                'password' => 'NewPassword123',
                'password_confirmation' => 'NewPassword123',
            ])
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Password reset successfully.',
            );

        $this->assertTrue(
            Hash::check(
                'NewPassword123',
                $user->fresh()->password,
            ),
        );
    }

    public function test_invalid_token_cannot_reset_password(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@test.com',
            'password' => 'old-password',
        ]);

        $this
            ->postJson('/api/v1/auth/reset-password', [
                'email' => $user->email,
                'token' => 'invalid-token',
                'password' => 'NewPassword123',
                'password_confirmation' => 'NewPassword123',
            ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'This password reset link is invalid or has expired.',
            );

        $this->assertTrue(
            Hash::check(
                'old-password',
                $user->fresh()->password,
            ),
        );
    }

    public function test_password_confirmation_is_required(): void
    {
        $user = User::factory()->create([
            'email' => 'reset@test.com',
        ]);

        $token = Password::broker()->createToken($user);

        $this
            ->postJson('/api/v1/auth/reset-password', [
                'email' => $user->email,
                'token' => $token,
                'password' => 'NewPassword123',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');
    }
}
