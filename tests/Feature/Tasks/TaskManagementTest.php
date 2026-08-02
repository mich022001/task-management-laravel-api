<?php

namespace Tests\Feature\Tasks;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_tasks_with_filters_and_pagination(): void
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

        Task::factory()->create([
            'team_id' => $team->id,
            'assigned_to' => $member->id,
            'created_by' => $manager->id,
            'title' => 'Build API documentation',
            'status' => 'pending',
            'priority' => 'high',
        ]);

        Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'title' => 'Unrelated task',
            'status' => 'completed',
            'priority' => 'low',
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->getJson(
                "/api/v1/tasks"
                . "?team_id={$team->id}"
                . "&assigned_to={$member->id}"
                . "&status=pending"
                . "&priority=high"
                . "&search=documentation"
                . "&per_page=10"
            );

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Tasks retrieved successfully.')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Build API documentation');
    }

    public function test_manager_can_create_task_for_authorized_team(): void
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
            ->postJson('/api/v1/tasks', [
                'team_id' => $team->id,
                'assigned_to' => $member->id,
                'title' => 'Implement task API',
                'description' => 'Create the task endpoints.',
                'priority' => 'high',
                'due_date' => now()->addDays(7)->toDateString(),
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Task created successfully.')
            ->assertJsonPath('data.task.title', 'Implement task API')
            ->assertJsonPath('data.task.status', 'pending')
            ->assertJsonPath('data.task.created_by', $manager->id);

        $this->assertDatabaseHas('tasks', [
            'team_id' => $team->id,
            'assigned_to' => $member->id,
            'created_by' => $manager->id,
            'status' => 'pending',
        ]);
    }

    public function test_manager_cannot_create_task_for_unrelated_team(): void
    {
        $manager = User::factory()->manager()->create();
        $otherManager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $otherManager->id,
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->postJson('/api/v1/tasks', [
                'team_id' => $team->id,
                'title' => 'Unauthorized task',
                'priority' => 'medium',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('team_id');
    }

    public function test_assignee_must_belong_to_selected_team(): void
    {
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->postJson('/api/v1/tasks', [
                'team_id' => $team->id,
                'assigned_to' => $member->id,
                'title' => 'Invalid assignment',
                'priority' => 'medium',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('assigned_to');
    }

    public function test_manager_can_view_and_update_task_in_authorized_team(): void
    {
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $team->members()->attach($member->id, [
            'member_role' => 'member',
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'assigned_to' => $member->id,
            'created_by' => $manager->id,
            'title' => 'Original title',
        ]);

        $showResponse = $this
            ->actingAs($manager, 'api')
            ->getJson("/api/v1/tasks/{$task->id}");

        $showResponse
            ->assertOk()
            ->assertJsonPath('data.task.id', $task->id);

        $updateResponse = $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/tasks/{$task->id}", [
                'title' => 'Updated title',
                'priority' => 'high',
            ]);

        $updateResponse
            ->assertOk()
            ->assertJsonPath('data.task.title', 'Updated title')
            ->assertJsonPath('data.task.priority', 'high');

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Updated title',
            'priority' => 'high',
        ]);
    }

    public function test_team_member_only_lists_assigned_tasks(): void
    {
        $member = User::factory()->teamMember()->create();
        $otherMember = User::factory()->teamMember()->create();

        $assignedTask = Task::factory()->create([
            'assigned_to' => $member->id,
            'title' => 'Assigned task',
        ]);

        Task::factory()->create([
            'assigned_to' => $otherMember->id,
            'title' => 'Hidden task',
        ]);

        $response = $this
            ->actingAs($member, 'api')
            ->getJson('/api/v1/tasks');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'id' => $assignedTask->id,
                'title' => 'Assigned task',
            ])
            ->assertJsonMissing([
                'title' => 'Hidden task',
            ]);
    }

    public function test_team_member_cannot_edit_task_fields(): void
    {
        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $member->id,
        ]);

        $response = $this
            ->actingAs($member, 'api')
            ->patchJson("/api/v1/tasks/{$task->id}", [
                'title' => 'Unauthorized update',
            ]);

        $response->assertForbidden();
    }

    public function test_manager_creator_can_delete_task(): void
    {
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->deleteJson("/api/v1/tasks/{$task->id}");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Task deleted successfully.');

        $this->assertSoftDeleted('tasks', [
            'id' => $task->id,
        ]);
    }
}
