<?php

namespace Tests\Feature\Notifications;

use App\Models\Notification;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutomaticTaskNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_task_creation_notifies_assignee(): void
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
                'team_id' => $team->uuid,
                'assigned_to' => $member->uuid,
                'title' => 'Implement notifications',
                'description' => 'Create automatic notifications.',
                'priority' => 'high',
            ]);

        $response->assertCreated();

        $task = Task::query()
            ->where('title', 'Implement notifications')
            ->firstOrFail();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $member->id,
            'task_id' => $task->id,
            'type' => 'task_assigned',
            'title' => 'New task assigned',
        ]);
    }

    public function test_unassigned_task_creation_does_not_create_notification(): void
    {
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $this
            ->actingAs($manager, 'api')
            ->postJson('/api/v1/tasks', [
                'team_id' => $team->uuid,
                'title' => 'Unassigned task',
                'priority' => 'medium',
            ])
            ->assertCreated();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_reassignment_notifies_only_new_assignee(): void
    {
        $manager = User::factory()->manager()->create();
        $oldAssignee = User::factory()->teamMember()->create();
        $newAssignee = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $team->members()->attach([
            $oldAssignee->id => ['member_role' => 'member'],
            $newAssignee->id => ['member_role' => 'member'],
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'assigned_to' => $oldAssignee->id,
        ]);

        $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}", [
                'assigned_to' => $newAssignee->uuid,
            ])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $newAssignee->id,
            'task_id' => $task->id,
            'type' => 'task_assigned',
        ]);

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $oldAssignee->id,
            'task_id' => $task->id,
        ]);
    }

    public function test_unchanged_assignee_does_not_create_notification(): void
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
            'created_by' => $manager->id,
            'assigned_to' => $member->id,
        ]);

        $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}", [
                'assigned_to' => $member->uuid,
                'priority' => 'high',
            ])
            ->assertOk();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_status_change_by_assignee_notifies_task_creator(): void
    {
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'assigned_to' => $member->id,
            'status' => 'pending',
            'completed_at' => null,
        ]);

        $this
            ->actingAs($member, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}/status", [
                'status' => 'in_progress',
                'note' => 'Work has started.',
            ])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $manager->id,
            'task_id' => $task->id,
            'type' => 'task_status_changed',
            'title' => 'Task status changed',
        ]);
    }

    public function test_completion_notifies_task_creator(): void
    {
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'assigned_to' => $member->id,
            'status' => 'in_progress',
            'completed_at' => null,
        ]);

        $this
            ->actingAs($member, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}/status", [
                'status' => 'completed',
            ])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $manager->id,
            'task_id' => $task->id,
            'type' => 'task_completed',
            'title' => 'Task completed',
        ]);
    }

    public function test_cancellation_notifies_task_creator(): void
    {
        $manager = User::factory()->manager()->create();
        $member = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'assigned_to' => $member->id,
            'status' => 'pending',
        ]);

        $this
            ->actingAs($member, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}/status", [
                'status' => 'cancelled',
            ])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $manager->id,
            'task_id' => $task->id,
            'type' => 'task_cancelled',
            'title' => 'Task cancelled',
        ]);
    }

    public function test_creator_status_change_does_not_notify_themselves(): void
    {
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'status' => 'pending',
        ]);

        $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}/status", [
                'status' => 'in_progress',
            ])
            ->assertOk();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_notification_deduplication_key_is_populated(): void
    {
        $notification = Notification::factory()->create();

        $this->assertNull($notification->deduplication_key);

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
            ->postJson('/api/v1/tasks', [
                'team_id' => $team->uuid,
                'assigned_to' => $member->uuid,
                'title' => 'Deduplicated task notification',
                'priority' => 'medium',
            ])
            ->assertCreated();

        $automaticNotification = Notification::query()
            ->where('type', 'task_assigned')
            ->firstOrFail();

        $this->assertNotNull(
            $automaticNotification->deduplication_key,
        );
    }
}
