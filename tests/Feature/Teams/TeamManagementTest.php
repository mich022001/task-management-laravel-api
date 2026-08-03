<?php

namespace Tests\Feature\Teams;

use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_teams_with_pagination_and_search(): void
    {
        $admin = User::factory()->admin()->create();

        Team::factory()->create([
            'name' => 'Engineering',
            'created_by' => $admin->id,
        ]);

        Team::factory()->create([
            'name' => 'Marketing',
            'created_by' => $admin->id,
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->getJson('/api/v1/teams?search=engine&per_page=10');

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Teams retrieved successfully.')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Engineering')
            ->assertJsonPath('meta.per_page', 10);
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

        $response = $this
            ->actingAs($creator, 'api')
            ->postJson('/api/v1/teams', [
                'name' => 'Platform Team',
                'manager_id' => $handler->uuid,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Team created successfully.')
            ->assertJsonPath('data.team.name', 'Platform Team')
            ->assertJsonPath('data.team.creator.id', $creator->uuid)
            ->assertJsonPath('data.team.members.0.id', $handler->uuid)
            ->assertJsonPath(
                'data.team.members.0.member_role',
                'lead',
            );

        $team = Team::query()
            ->where('name', 'Platform Team')
            ->firstOrFail();

        $this->assertSame($creator->id, $team->created_by);

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $handler->id,
            'member_role' => 'lead',
        ]);

        $this->assertDatabaseMissing('team_members', [
            'team_id' => $team->id,
            'user_id' => $creator->id,
        ]);
    }

    public function test_manager_only_lists_teams_they_created_or_joined(): void
    {
        $manager = User::factory()->manager()->create();
        $otherManager = User::factory()->manager()->create();

        $ownedTeam = Team::factory()->create([
            'name' => 'Owned Team',
            'created_by' => $manager->id,
        ]);

        $joinedTeam = Team::factory()->create([
            'name' => 'Joined Team',
            'created_by' => $otherManager->id,
        ]);

        Team::factory()->create([
            'name' => 'Hidden Team',
            'created_by' => $otherManager->id,
        ]);

        $joinedTeam->members()->attach($manager->id, [
            'member_role' => 'member',
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->getJson('/api/v1/teams');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'name' => $ownedTeam->name,
            ])
            ->assertJsonFragment([
                'name' => $joinedTeam->name,
            ])
            ->assertJsonMissing([
                'name' => 'Hidden Team',
            ]);
    }

    public function test_manager_can_view_team_they_belong_to(): void
    {
        $manager = User::factory()->manager()->create();
        $owner = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $owner->id,
        ]);

        $team->members()->attach($manager->id, [
            'member_role' => 'member',
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->getJson("/api/v1/teams/{$team->uuid}");

        $response
            ->assertOk()
            ->assertJsonPath('data.team.id', $team->uuid);
    }

    public function test_team_member_cannot_access_team_management(): void
    {
        $member = User::factory()->teamMember()->create();

        $response = $this
            ->actingAs($member, 'api')
            ->getJson('/api/v1/teams');

        $response->assertForbidden();
    }
}
