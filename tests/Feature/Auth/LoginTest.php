<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    private function resetApiGuard(): void
    {
        auth()->forgetGuards();

        if (app()->bound('tymon.jwt.auth')) {
            app('tymon.jwt.auth')->unsetToken();
        }

        if (app()->bound('tymon.jwt.manager')) {
            app()->forgetInstance('tymon.jwt.manager');
        }

        if (app()->bound('tymon.jwt.auth')) {
            app()->forgetInstance('tymon.jwt.auth');
        }
    }

    public function test_active_user_can_login(): void
    {
        User::factory()->create([
            'email' => 'admin@test.com',
            'password' => 'password123',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Login successful.')
            ->assertJsonPath('data.user.email', 'admin@test.com')
            ->assertJsonPath('data.user.role', 'admin')
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'is_active',
                    ],
                    'access_token',
                    'token_type',
                    'expires_in',
                ],
            ]);

        $token = $response->json('data.access_token');

        $payload = auth('api')
            ->setToken($token)
            ->payload();

        $this->assertSame('admin@test.com', $payload->get('email'));
        $this->assertSame('admin', $payload->get('role'));
        $this->assertTrue($payload->get('is_active'));
    }

    public function test_invalid_credentials_return_unauthorized(): void
    {
        User::factory()->create([
            'email' => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@test.com',
            'password' => 'incorrect-password',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJson([
                'message' => 'Invalid email or password.',
            ]);
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::factory()->inactive()->create([
            'email' => 'inactive@test.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'inactive@test.com',
            'password' => 'password123',
        ]);

        $response
            ->assertForbidden()
            ->assertJson([
                'message' => 'Your account is inactive.',
            ]);
    }

    public function test_login_requires_email_and_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
                'password',
            ]);
    }

    public function test_me_endpoint_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/auth/me');

        $response->assertUnauthorized();
    }

    public function test_login_is_rate_limited_after_five_attempts(): void
    {
        User::factory()->create([
            'email' => 'limited@test.com',
            'password' => 'password123',
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this
                ->postJson('/api/v1/auth/login', [
                    'email' => 'limited@test.com',
                    'password' => 'incorrect-password',
                ])
                ->assertUnauthorized();
        }

        $this
            ->postJson('/api/v1/auth/login', [
                'email' => 'limited@test.com',
                'password' => 'incorrect-password',
            ])
            ->assertTooManyRequests()
            ->assertJsonPath(
                'message',
                'Too many login attempts. Please try again later.',
            );
    }

    public function test_logout_invalidates_current_token(): void
    {
        User::factory()->create([
            'email' => 'logout@test.com',
            'password' => 'password123',
            'is_active' => true,
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'logout@test.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('data.access_token');

        $this
            ->withToken($token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logout successful.');

        $this
            ->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_refresh_returns_a_valid_rotated_token(): void
    {
        User::factory()->create([
            'email' => 'refresh@test.com',
            'password' => 'password123',
            'is_active' => true,
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'refresh@test.com',
            'password' => 'password123',
        ]);

        $oldToken = $loginResponse->json('data.access_token');

        $refreshResponse = $this
            ->withToken($oldToken)
            ->postJson('/api/v1/auth/refresh');

        $refreshResponse
            ->assertOk()
            ->assertJsonPath('message', 'Token refreshed successfully.')
            ->assertJsonStructure([
                'message',
                'data' => [
                    'user',
                    'access_token',
                    'token_type',
                    'expires_in',
                ],
            ]);

        $newToken = $refreshResponse->json('data.access_token');

        $this->assertNotSame($oldToken, $newToken);

        $this->resetApiGuard();

        $authenticatedUser = auth('api')
            ->setToken($newToken)
            ->user();

        $this->assertNotNull($authenticatedUser);
        $this->assertSame(
            'refresh@test.com',
            $authenticatedUser->email,
        );
    }

    public function test_refresh_invalidates_the_previous_token(): void
    {
        User::factory()->create([
            'email' => 'rotation@test.com',
            'password' => 'password123',
            'is_active' => true,
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'rotation@test.com',
            'password' => 'password123',
        ]);

        $oldToken = $loginResponse->json('data.access_token');

        $this
            ->withToken($oldToken)
            ->postJson('/api/v1/auth/refresh')
            ->assertOk();

        $this->resetApiGuard();

        $this
            ->withToken($oldToken)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_inactive_user_cannot_refresh_existing_token(): void
    {
        $user = User::factory()->create([
            'email' => 'deactivated@test.com',
            'password' => 'password123',
            'is_active' => true,
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'deactivated@test.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('data.access_token');

        $user->update([
            'is_active' => false,
        ]);

        $this->resetApiGuard();

        $this
            ->withToken($token)
            ->postJson('/api/v1/auth/refresh')
            ->assertForbidden()
            ->assertJsonPath('message', 'Your account is inactive.');
    }
}
