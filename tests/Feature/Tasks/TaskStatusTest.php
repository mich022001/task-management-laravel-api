<?php

namespace Tests\Feature\Tasks;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_member_can_transition_pending_to_in_progress(): void
    {
        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $member->id,
            'status' => 'pending',
            'completed_at' => null,
        ]);

        $response = $this
            ->actingAs($member, 'api')
            ->patchJson("/api/v1/tasks/{$task->id}/status", [
                'status' => 'in_progress',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Task status updated successfully.'
            )
            ->assertJsonPath('data.task.status', 'in_progress')
            ->assertJsonPath('data.task.allowed_transitions', [
                'pending',
                'completed',
                'cancelled',
            ]);

        $this->assertDatabaseHas('task_status_histories', [
            'task_id' => $task->id,
            'previous_status' => 'pending',
            'new_status' => 'in_progress',
            'changed_by' => $member->id,
        ]);
    }

    public function test_in_progress_task_can_transition_to_completed(): void
    {
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'status' => 'in_progress',
            'completed_at' => null,
        ]);

        $response = $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/tasks/{$task->id}/status", [
                'status' => 'completed',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.task.status', 'completed')
            ->assertJsonPath('data.task.allowed_transitions', []);

        $task->refresh();

        $this->assertNotNull($task->completed_at);

        $this->assertDatabaseHas('task_status_histories', [
            'task_id' => $task->id,
            'previous_status' => 'in_progress',
            'new_status' => 'completed',
            'changed_by' => $manager->id,
        ]);
    }

    public function test_pending_task_can_transition_to_cancelled(): void
    {
        $admin = User::factory()->admin()->create();

        $task = Task::factory()->create([
            'status' => 'pending',
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->patchJson("/api/v1/tasks/{$task->id}/status", [
                'status' => 'cancelled',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.task.status', 'cancelled');
    }

    public function test_completed_task_cannot_transition_again(): void
    {
        $admin = User::factory()->admin()->create();

        $task = Task::factory()->create([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->patchJson("/api/v1/tasks/{$task->id}/status", [
                'status' => 'pending',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->assertDatabaseMissing('task_status_histories', [
            'task_id' => $task->id,
            'new_status' => 'pending',
        ]);
    }

    public function test_task_cannot_transition_to_same_status(): void
    {
        $admin = User::factory()->admin()->create();

        $task = Task::factory()->create([
            'status' => 'pending',
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->patchJson("/api/v1/tasks/{$task->id}/status", [
                'status' => 'pending',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_unassigned_member_cannot_change_task_status(): void
    {
        $member = User::factory()->teamMember()->create();
        $otherMember = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $otherMember->id,
            'status' => 'pending',
        ]);

        $response = $this
            ->actingAs($member, 'api')
            ->patchJson("/api/v1/tasks/{$task->id}/status", [
                'status' => 'in_progress',
            ]);

        $response->assertForbidden();
    }

    public function test_failed_transition_does_not_modify_task_or_history(): void
    {
        $admin = User::factory()->admin()->create();

        $task = Task::factory()->create([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->patchJson("/api/v1/tasks/{$task->id}/status", [
                'status' => 'in_progress',
            ]);

        $response->assertUnprocessable();

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'completed',
        ]);

        $this->assertDatabaseCount('task_status_histories', 0);
    }
}
