<?php

namespace Tests\Feature\Teams;

use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamAdministrationAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_team_with_assigned_manager(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $handler = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->postJson('/api/v1/teams', [
                'name' => 'Administration Team',
                'manager_id' => $handler->uuid,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath(
                'data.team.name',
                'Administration Team',
            )
            ->assertJsonPath(
                'data.team.creator.id',
                $admin->uuid,
            )
            ->assertJsonPath(
                'data.team.members.0.id',
                $handler->uuid,
            )
            ->assertJsonPath(
                'data.team.members.0.member_role',
                'lead',
            );

        $team = Team::query()
            ->where('name', 'Administration Team')
            ->firstOrFail();

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $handler->id,
            'member_role' => 'lead',
        ]);
    }

    public function test_manager_can_create_team_with_assigned_handler(): void
    {
        $creator = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $handler = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $this
            ->actingAs($creator, 'api')
            ->postJson('/api/v1/teams', [
                'name' => 'Manager Created Team',
                'manager_id' => $handler->uuid,
            ])
            ->assertCreated()
            ->assertJsonPath(
                'data.team.creator.id',
                $creator->uuid,
            )
            ->assertJsonPath(
                'data.team.members.0.id',
                $handler->uuid,
            )
            ->assertJsonPath(
                'data.team.members.0.member_role',
                'lead',
            );
    }

    public function test_admin_can_add_team_member(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $handler = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $member = User::factory()->create([
            'role' => 'team_member',
            'is_active' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $admin->id,
        ]);

        $team->members()->attach($handler->id, [
            'member_role' => 'lead',
        ]);

        $this
            ->actingAs($admin, 'api')
            ->postJson("/api/v1/teams/{$team->uuid}/members", [
                'user_id' => $member->uuid,
                'member_role' => 'member',
            ])
            ->assertOk();

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $member->id,
            'member_role' => 'member',
        ]);
    }

    public function test_assigned_manager_lead_can_add_team_member(): void
    {
        $creator = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $handler = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $member = User::factory()->create([
            'role' => 'team_member',
            'is_active' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $creator->id,
        ]);

        $team->members()->attach($handler->id, [
            'member_role' => 'lead',
        ]);

        $this
            ->actingAs($handler, 'api')
            ->postJson("/api/v1/teams/{$team->uuid}/members", [
                'user_id' => $member->uuid,
                'member_role' => 'member',
            ])
            ->assertOk();

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $member->id,
            'member_role' => 'member',
        ]);
    }

    public function test_unassigned_manager_cannot_add_team_member(): void
    {
        $creator = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $handler = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $unassignedManager = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $member = User::factory()->create([
            'role' => 'team_member',
            'is_active' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $creator->id,
        ]);

        $team->members()->attach($handler->id, [
            'member_role' => 'lead',
        ]);

        $this
            ->actingAs($unassignedManager, 'api')
            ->postJson("/api/v1/teams/{$team->uuid}/members", [
                'user_id' => $member->uuid,
                'member_role' => 'member',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('team_members', [
            'team_id' => $team->id,
            'user_id' => $member->id,
        ]);
    }

    public function test_manager_can_view_assigned_team(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $manager = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $admin->id,
        ]);

        $team->members()->attach($manager->id, [
            'member_role' => 'lead',
        ]);

        $this
            ->actingAs($manager, 'api')
            ->getJson("/api/v1/teams/{$team->uuid}")
            ->assertOk()
            ->assertJsonPath('data.team.id', $team->uuid);
    }

    public function test_manager_cannot_view_unassigned_team(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $manager = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $admin->id,
        ]);

        $this
            ->actingAs($manager, 'api')
            ->getJson("/api/v1/teams/{$team->uuid}")
            ->assertForbidden();
    }
}
