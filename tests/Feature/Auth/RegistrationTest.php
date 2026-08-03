<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_user_can_register_as_inactive_team_member(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Pending Member',
            'email' => 'pending.member@test.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Registration successful. Your account is pending administrator approval.',
            )
            ->assertJsonPath('data.user.role', 'team_member')
            ->assertJsonPath('data.user.is_active', false);

        $this->assertDatabaseHas('users', [
            'name' => 'Pending Member',
            'email' => 'pending.member@test.com',
            'role' => 'team_member',
            'is_active' => false,
        ]);
    }

    public function test_registration_cannot_override_role_or_status(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Privilege Attempt',
            'email' => 'privilege.attempt@test.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'role' => 'admin',
            'is_active' => true,
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'privilege.attempt@test.com',
            'role' => 'team_member',
            'is_active' => false,
        ]);
    }

    public function test_registration_requires_valid_fields(): void
    {
        $response = $this->postJson('/api/v1/auth/register', []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'email',
                'password',
            ]);
    }

    public function test_registration_requires_unique_email(): void
    {
        User::factory()->create([
            'email' => 'existing.user@test.com',
        ]);

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Existing User',
            'email' => 'existing.user@test.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
            ]);
    }

    public function test_registration_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Pending Member',
            'email' => 'pending.confirmation@test.com',
            'password' => 'Password123',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'password',
            ]);
    }

    public function test_registered_pending_user_cannot_login(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Pending Member',
            'email' => 'pending.login@test.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ])->assertCreated();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'pending.login@test.com',
            'password' => 'Password123',
        ]);

        $response->assertForbidden();
    }
}
