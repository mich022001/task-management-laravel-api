<?php

namespace Tests\Feature\Users;

use App\Models\Team;
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

        $visibleMember = User::factory()->teamMember()->create([
            'email' => 'visible.member@example.com',
        ]);

        $managedTeam = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $managedTeam->members()->attach($visibleMember->id, [
            'member_role' => 'member',
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

    public function test_manager_only_lists_members_from_teams_they_manage(): void
    {
        $manager = User::factory()->manager()->create();

        $managedMember = User::factory()->teamMember()->create([
            'email' => 'managed.member@example.com',
        ]);

        $unrelatedMember = User::factory()->teamMember()->create([
            'email' => 'unrelated.member@example.com',
        ]);

        $managedTeam = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $managedTeam->members()->attach($managedMember->id, [
            'member_role' => 'member',
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->getJson('/api/v1/users');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'email' => 'managed.member@example.com',
            ])
            ->assertJsonMissing([
                'email' => 'unrelated.member@example.com',
            ]);
    }

    public function test_manager_can_view_member_from_managed_team(): void
    {
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $team->members()->attach($member->id, [
            'member_role' => 'member',
        ]);

        $this
            ->actingAs($manager, 'api')
            ->getJson("/api/v1/users/{$member->id}")
            ->assertOk();
    }

    public function test_manager_cannot_view_unrelated_member(): void
    {
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $this
            ->actingAs($manager, 'api')
            ->getJson("/api/v1/users/{$member->id}")
            ->assertForbidden();
    }

    public function test_manager_cannot_update_unrelated_member(): void
    {
        $manager = User::factory()->manager()->create();

        $member = User::factory()->teamMember()->create([
            'name' => 'Original Member',
        ]);

        $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/users/{$member->id}", [
                'name' => 'Unauthorized Update',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'name' => 'Original Member',
        ]);
    }

    public function test_manager_cannot_change_unrelated_member_status(): void
    {
        $manager = User::factory()->manager()->create();

        $member = User::factory()->teamMember()->create([
            'is_active' => true,
        ]);

        $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/users/{$member->id}/status", [
                'is_active' => false,
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'is_active' => true,
        ]);
    }

    public function test_team_lead_manager_can_manage_team_member(): void
    {
        $teamOwner = User::factory()->manager()->create();
        $teamLead = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $teamOwner->id,
        ]);

        $team->members()->attach([
            $teamLead->id => [
                'member_role' => 'lead',
            ],
            $member->id => [
                'member_role' => 'member',
            ],
        ]);

        $this
            ->actingAs($teamLead, 'api')
            ->patchJson("/api/v1/users/{$member->id}", [
                'name' => 'Lead Updated Member',
            ])
            ->assertOk()
            ->assertJsonPath(
                'data.user.name',
                'Lead Updated Member',
            );
    }
}
