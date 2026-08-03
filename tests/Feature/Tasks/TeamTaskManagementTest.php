<?php

namespace Tests\Feature\Tasks;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamTaskManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_tasks_for_nested_team_route(): void
    {
        $admin = User::factory()->admin()->create();

        $firstTeam = Team::factory()->create();
        $secondTeam = Team::factory()->create();

        $expectedTask = Task::factory()->create([
            'team_id' => $firstTeam->id,
            'title' => 'Expected team task',
        ]);

        Task::factory()->create([
            'team_id' => $secondTeam->id,
            'title' => 'Other team task',
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->getJson("/api/v1/teams/{$firstTeam->uuid}/tasks");

        $response
            ->assertOk()
            ->assertJsonFragment([
                'id' => $expectedTask->uuid,
                'title' => 'Expected team task',
            ])
            ->assertJsonMissing([
                'title' => 'Other team task',
            ]);
    }

    public function test_nested_team_list_supports_required_filters(): void
    {
        $admin = User::factory()->admin()->create();
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $team->members()->attach($member->id, [
            'member_role' => 'member',
        ]);

        $matchingTask = Task::factory()->create([
            'team_id' => $team->id,
            'assigned_to' => $member->id,
            'created_by' => $manager->id,
            'title' => 'Matching nested task',
            'status' => 'pending',
            'priority' => 'high',
        ]);

        Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'title' => 'Non-matching nested task',
            'status' => 'completed',
            'priority' => 'low',
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->getJson(
                "/api/v1/teams/{$team->uuid}/tasks"
                .'?status=pending'
                .'&priority=high'
                ."&assigned_to={$member->uuid}"
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matchingTask->uuid);
    }

    public function test_manager_can_list_tasks_for_authorized_team(): void
    {
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'title' => 'Managed task',
        ]);

        $this
            ->actingAs($manager, 'api')
            ->getJson("/api/v1/teams/{$team->uuid}/tasks")
            ->assertOk()
            ->assertJsonFragment([
                'id' => $task->uuid,
                'title' => 'Managed task',
            ]);
    }

    public function test_unrelated_manager_cannot_list_team_tasks(): void
    {
        $manager = User::factory()->manager()->create();
        $otherManager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $otherManager->id,
        ]);

        $this
            ->actingAs($manager, 'api')
            ->getJson("/api/v1/teams/{$team->uuid}/tasks")
            ->assertForbidden();
    }

    public function test_team_member_only_sees_assigned_team_tasks(): void
    {
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();
        $otherMember = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $team->members()->attach($member->id, [
            'member_role' => 'member',
        ]);

        $team->members()->attach($otherMember->id, [
            'member_role' => 'member',
        ]);

        $assignedTask = Task::factory()->create([
            'team_id' => $team->id,
            'assigned_to' => $member->id,
            'created_by' => $manager->id,
            'title' => 'Assigned nested task',
        ]);

        Task::factory()->create([
            'team_id' => $team->id,
            'assigned_to' => $otherMember->id,
            'created_by' => $manager->id,
            'title' => 'Hidden nested task',
        ]);

        $response = $this
            ->actingAs($member, 'api')
            ->getJson("/api/v1/teams/{$team->uuid}/tasks");

        $response
            ->assertOk()
            ->assertJsonFragment([
                'id' => $assignedTask->uuid,
                'title' => 'Assigned nested task',
            ])
            ->assertJsonMissing([
                'title' => 'Hidden nested task',
            ]);
    }

    public function test_non_member_cannot_list_nested_team_tasks(): void
    {
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $this
            ->actingAs($member, 'api')
            ->getJson("/api/v1/teams/{$team->uuid}/tasks")
            ->assertForbidden();
    }

    public function test_manager_can_create_task_through_nested_route(): void
    {
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $team->members()->attach($member->id, [
            'member_role' => 'member',
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->postJson("/api/v1/teams/{$team->uuid}/tasks", [
                'assigned_to' => $member->uuid,
                'title' => 'Nested route task',
                'description' => 'Created through the nested endpoint.',
                'priority' => 'high',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.task.team_id', $team->uuid)
            ->assertJsonPath('data.task.title', 'Nested route task')
            ->assertJsonPath('data.task.status', 'pending');

        $this->assertDatabaseHas('tasks', [
            'team_id' => $team->id,
            'assigned_to' => $member->id,
            'created_by' => $manager->id,
            'title' => 'Nested route task',
        ]);
    }

    public function test_nested_route_team_overrides_body_team_id(): void
    {
        $admin = User::factory()->admin()->create();

        $routeTeam = Team::factory()->create();
        $bodyTeam = Team::factory()->create();

        $response = $this
            ->actingAs($admin, 'api')
            ->postJson("/api/v1/teams/{$routeTeam->uuid}/tasks", [
                'team_id' => $bodyTeam->uuid,
                'title' => 'Route-authoritative task',
                'priority' => 'medium',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.task.team_id', $routeTeam->uuid);

        $this->assertDatabaseHas('tasks', [
            'team_id' => $routeTeam->id,
            'title' => 'Route-authoritative task',
        ]);

        $this->assertDatabaseMissing('tasks', [
            'team_id' => $bodyTeam->id,
            'title' => 'Route-authoritative task',
        ]);
    }

    public function test_manager_cannot_create_for_unrelated_nested_team(): void
    {
        $manager = User::factory()->manager()->create();
        $otherManager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $otherManager->id,
        ]);

        $this
            ->actingAs($manager, 'api')
            ->postJson("/api/v1/teams/{$team->uuid}/tasks", [
                'title' => 'Unauthorized nested task',
                'priority' => 'medium',
            ])
            ->assertForbidden();
    }

    public function test_non_lead_manager_cannot_create_nested_team_task(): void
    {
        $owner = User::factory()->manager()->create();
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $owner->id,
        ]);

        $team->members()->attach($manager->id, [
            'member_role' => 'member',
        ]);

        $this
            ->actingAs($manager, 'api')
            ->postJson("/api/v1/teams/{$team->uuid}/tasks", [
                'title' => 'Unauthorized manager task',
                'priority' => 'medium',
            ])
            ->assertForbidden();
    }

    public function test_team_member_cannot_create_nested_team_task(): void
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
            ->actingAs($member, 'api')
            ->postJson("/api/v1/teams/{$team->uuid}/tasks", [
                'title' => 'Member-created task',
                'priority' => 'medium',
            ])
            ->assertForbidden();
    }

    public function test_nested_task_assignee_must_belong_to_route_team(): void
    {
        $manager = User::factory()->manager()->create();
        $outsider = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->postJson("/api/v1/teams/{$team->uuid}/tasks", [
                'assigned_to' => $outsider->uuid,
                'title' => 'Invalid nested assignment',
                'priority' => 'medium',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('assigned_to');
    }

    public function test_invalid_nested_team_uuid_returns_not_found(): void
    {
        $admin = User::factory()->admin()->create();

        $this
            ->actingAs($admin, 'api')
            ->getJson(
                '/api/v1/teams/'
                .'00000000-0000-4000-8000-000000000000/tasks',
            )
            ->assertNotFound();
    }
}
