<?php

namespace Tests\Feature\Teams;

use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamEditingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_any_team(): void
    {
        $admin = User::factory()->admin()->create();
        $creator = User::factory()->manager()->create();
        $oldManager = User::factory()->manager()->create();
        $newManager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'name' => 'Original Team',
            'created_by' => $creator->id,
        ]);

        $team->members()->attach($oldManager->id, [
            'member_role' => 'lead',
        ]);

        $this
            ->actingAs($admin, 'api')
            ->patchJson("/api/v1/teams/{$team->uuid}", [
                'name' => 'Updated Team',
                'manager_id' => $newManager->uuid,
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Team updated successfully.')
            ->assertJsonPath('data.team.name', 'Updated Team');

        $this->assertDatabaseHas('teams', [
            'id' => $team->id,
            'name' => 'Updated Team',
        ]);

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $oldManager->id,
            'member_role' => 'member',
        ]);

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $newManager->id,
            'member_role' => 'lead',
        ]);
    }

    public function test_assigned_lead_manager_can_update_team(): void
    {
        $creator = User::factory()->manager()->create();
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'name' => 'Managed Team',
            'created_by' => $creator->id,
        ]);

        $team->members()->attach($manager->id, [
            'member_role' => 'lead',
        ]);

        $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/teams/{$team->uuid}", [
                'name' => 'Renamed Managed Team',
                'manager_id' => $manager->uuid,
            ])
            ->assertOk()
            ->assertJsonPath(
                'data.team.name',
                'Renamed Managed Team',
            );
    }

    public function test_creator_cannot_update_team_without_lead_assignment(): void
    {
        $creator = User::factory()->manager()->create();
        $handler = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'name' => 'Protected Team',
            'created_by' => $creator->id,
        ]);

        $team->members()->attach($handler->id, [
            'member_role' => 'lead',
        ]);

        $this
            ->actingAs($creator, 'api')
            ->patchJson("/api/v1/teams/{$team->uuid}", [
                'name' => 'Unauthorized Rename',
                'manager_id' => $handler->uuid,
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('teams', [
            'id' => $team->id,
            'name' => 'Protected Team',
        ]);
    }

    public function test_regular_manager_member_cannot_update_team(): void
    {
        $creator = User::factory()->manager()->create();
        $manager = User::factory()->manager()->create();
        $handler = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $creator->id,
        ]);

        $team->members()->attach([
            $manager->id => [
                'member_role' => 'member',
            ],
            $handler->id => [
                'member_role' => 'lead',
            ],
        ]);

        $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/teams/{$team->uuid}", [
                'name' => 'Unauthorized Rename',
                'manager_id' => $handler->uuid,
            ])
            ->assertForbidden();
    }

    public function test_team_handler_must_have_manager_role(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $admin->id,
        ]);

        $this
            ->actingAs($admin, 'api')
            ->patchJson("/api/v1/teams/{$team->uuid}", [
                'name' => 'Invalid Handler Team',
                'manager_id' => $member->uuid,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('manager_id');
    }

    public function test_team_name_must_remain_unique_except_for_current_team(): void
    {
        $admin = User::factory()->admin()->create();
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'name' => 'Engineering',
            'created_by' => $admin->id,
        ]);

        Team::factory()->create([
            'name' => 'Operations',
            'created_by' => $admin->id,
        ]);

        $team->members()->attach($manager->id, [
            'member_role' => 'lead',
        ]);

        $this
            ->actingAs($admin, 'api')
            ->patchJson("/api/v1/teams/{$team->uuid}", [
                'name' => 'Engineering',
                'manager_id' => $manager->uuid,
            ])
            ->assertOk();

        $this
            ->actingAs($admin, 'api')
            ->patchJson("/api/v1/teams/{$team->uuid}", [
                'name' => 'Operations',
                'manager_id' => $manager->uuid,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }
}
