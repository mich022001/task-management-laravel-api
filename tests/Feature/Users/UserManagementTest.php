<?php

namespace Tests\Feature\Users;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_users_with_pagination_and_filters(): void
    {
        $admin = User::factory()->admin()->create();

        User::factory()->teamMember()->create([
            'name' => 'Michael Member',
            'email' => 'michael@example.com',
            'is_active' => true,
        ]);

        User::factory()->teamMember()->inactive()->create([
            'name' => 'Inactive Member',
            'email' => 'inactive@example.com',
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->getJson(
                '/api/v1/users'
                .'?role=team_member'
                .'&status=active'
                .'&search=michael'
                .'&per_page=10'
            );

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Users retrieved successfully.')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'michael@example.com');
    }

    public function test_admin_can_create_manager_user(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this
            ->actingAs($admin, 'api')
            ->postJson('/api/v1/users', [
                'name' => 'New Manager',
                'email' => 'new.manager@example.com',
                'password' => 'password123',
                'role' => 'manager',
                'is_active' => true,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'User created successfully.')
            ->assertJsonPath('data.user.email', 'new.manager@example.com')
            ->assertJsonPath('data.user.role', 'manager');

        $this->assertDatabaseHas('users', [
            'email' => 'new.manager@example.com',
            'role' => 'manager',
            'is_active' => true,
        ]);
    }

    public function test_manager_can_create_team_member_only(): void
    {
        $manager = User::factory()->manager()->create();

        $allowedResponse = $this
            ->actingAs($manager, 'api')
            ->postJson('/api/v1/users', [
                'name' => 'Allowed Member',
                'email' => 'allowed.member@example.com',
                'password' => 'password123',
                'role' => 'team_member',
            ]);

        $allowedResponse->assertCreated();

        $forbiddenResponse = $this
            ->actingAs($manager, 'api')
            ->postJson('/api/v1/users', [
                'name' => 'Forbidden Manager',
                'email' => 'forbidden.manager@example.com',
                'password' => 'password123',
                'role' => 'manager',
            ]);

        $forbiddenResponse
            ->assertUnprocessable()
            ->assertJsonValidationErrors('role');
    }

    public function test_manager_only_lists_team_members(): void
    {
        $manager = User::factory()->manager()->create();

        User::factory()->admin()->create([
            'email' => 'another.admin@example.com',
        ]);

        User::factory()->teamMember()->create([
            'email' => 'visible.member@example.com',
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->getJson('/api/v1/users');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'email' => 'visible.member@example.com',
            ])
            ->assertJsonMissing([
                'email' => 'another.admin@example.com',
            ]);
    }

    public function test_admin_can_update_user_and_status(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->teamMember()->create();

        $updateResponse = $this
            ->actingAs($admin, 'api')
            ->patchJson("/api/v1/users/{$member->id}", [
                'name' => 'Updated Member',
                'email' => 'updated.member@example.com',
                'role' => 'team_member',
            ]);

        $updateResponse
            ->assertOk()
            ->assertJsonPath('data.user.name', 'Updated Member')
            ->assertJsonPath(
                'data.user.email',
                'updated.member@example.com'
            );

        $statusResponse = $this
            ->actingAs($admin, 'api')
            ->patchJson("/api/v1/users/{$member->id}/status", [
                'is_active' => false,
            ]);

        $statusResponse
            ->assertOk()
            ->assertJsonPath('data.user.is_active', false);

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'is_active' => false,
        ]);
    }

    public function test_team_member_cannot_access_user_management(): void
    {
        $member = User::factory()->teamMember()->create();

        $response = $this
            ->actingAs($member, 'api')
            ->getJson('/api/v1/users');

        $response->assertForbidden();
    }

    public function test_new_user_defaults_to_active_when_status_is_omitted(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this
            ->actingAs($manager, 'api')
            ->postJson('/api/v1/users', [
                'name' => 'Default Active Member',
                'email' => 'default.active@example.com',
                'password' => 'password123',
                'role' => 'team_member',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user.is_active', true);

        $this->assertDatabaseHas('users', [
            'email' => 'default.active@example.com',
            'is_active' => true,
        ]);
    }
}
