<?php

namespace Tests\Feature\Teams;

use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamMemberManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_add_active_user_to_team(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $admin->id,
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->postJson("/api/v1/teams/{$team->id}/members", [
                'user_id' => $member->id,
                'member_role' => 'member',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Team member added successfully.'
            );

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $member->id,
            'member_role' => 'member',
        ]);
    }

    public function test_inactive_user_cannot_be_added_to_team(): void
    {
        $admin = User::factory()->admin()->create();
        $inactiveMember = User::factory()
            ->teamMember()
            ->inactive()
            ->create();

        $team = Team::factory()->create([
            'created_by' => $admin->id,
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->postJson("/api/v1/teams/{$team->id}/members", [
                'user_id' => $inactiveMember->id,
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('user_id');
    }

    public function test_manager_lead_can_add_team_member(): void
    {
        $owner = User::factory()->manager()->create();
        $lead = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $owner->id,
        ]);

        $team->members()->attach($lead->id, [
            'member_role' => 'lead',
        ]);

        $response = $this
            ->actingAs($lead, 'api')
            ->postJson("/api/v1/teams/{$team->id}/members", [
                'user_id' => $member->id,
            ]);

        $response->assertOk();

        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $member->id,
            'member_role' => 'member',
        ]);
    }

    public function test_non_lead_manager_cannot_manage_members(): void
    {
        $owner = User::factory()->manager()->create();
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $owner->id,
        ]);

        $team->members()->attach($manager->id, [
            'member_role' => 'member',
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->postJson("/api/v1/teams/{$team->id}/members", [
                'user_id' => $member->id,
            ]);

        $response->assertForbidden();
    }

    public function test_admin_can_remove_member_from_team(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $admin->id,
        ]);

        $team->members()->attach($member->id, [
            'member_role' => 'member',
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->deleteJson(
                "/api/v1/teams/{$team->id}/members/{$member->id}"
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Team member removed successfully.'
            );

        $this->assertDatabaseMissing('team_members', [
            'team_id' => $team->id,
            'user_id' => $member->id,
        ]);
    }

    public function test_team_creator_cannot_be_removed(): void
    {
        $admin = User::factory()->admin()->create();

        $team = Team::factory()->create([
            'created_by' => $admin->id,
        ]);

        $team->members()->attach($admin->id, [
            'member_role' => 'lead',
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->deleteJson(
                "/api/v1/teams/{$team->id}/members/{$admin->id}"
            );

        $response
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'The team creator cannot be removed.'
            );
    }
}
