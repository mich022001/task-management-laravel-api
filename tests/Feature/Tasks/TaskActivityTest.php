<?php

namespace Tests\Feature\Tasks;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_assigned_member_can_add_and_list_comments(): void
    {
        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $member->id,
        ]);

        $createResponse = $this
            ->actingAs($member, 'api')
            ->postJson("/api/v1/tasks/{$task->uuid}/comments", [
                'body' => 'The implementation is ready for review.',
            ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Task comment added successfully.',
            )
            ->assertJsonPath(
                'data.comment.body',
                'The implementation is ready for review.',
            )
            ->assertJsonPath(
                'data.comment.user.id',
                $member->uuid,
            );

        $this->assertDatabaseHas('task_comments', [
            'task_id' => $task->id,
            'user_id' => $member->id,
            'body' => 'The implementation is ready for review.',
        ]);

        $listResponse = $this
            ->actingAs($member, 'api')
            ->getJson("/api/v1/tasks/{$task->uuid}/comments");

        $listResponse
            ->assertOk()
            ->assertJsonPath(
                'data.0.body',
                'The implementation is ready for review.',
            );
    }

    public function test_unassigned_member_cannot_access_task_comments(): void
    {
        $member = User::factory()->teamMember()->create();
        $otherMember = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $otherMember->id,
        ]);

        $this
            ->actingAs($member, 'api')
            ->getJson("/api/v1/tasks/{$task->uuid}/comments")
            ->assertForbidden();

        $this
            ->actingAs($member, 'api')
            ->postJson("/api/v1/tasks/{$task->uuid}/comments", [
                'body' => 'Unauthorized comment.',
            ])
            ->assertForbidden();
    }

    public function test_comment_body_is_required(): void
    {
        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $member->id,
        ]);

        $this
            ->actingAs($member, 'api')
            ->postJson("/api/v1/tasks/{$task->uuid}/comments", [
                'body' => '   ',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');
    }

    public function test_status_transition_stores_optional_note(): void
    {
        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $member->id,
            'status' => 'pending',
            'completed_at' => null,
        ]);

        $response = $this
            ->actingAs($member, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}/status", [
                'status' => 'in_progress',
                'note' => 'Started after requirements clarification.',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.task.status',
                'in_progress',
            );

        $this->assertDatabaseHas('task_status_histories', [
            'task_id' => $task->id,
            'previous_status' => 'pending',
            'new_status' => 'in_progress',
            'note' => 'Started after requirements clarification.',
            'changed_by' => $member->id,
        ]);
    }

    public function test_admin_can_view_task_activity(): void
    {
        $admin = User::factory()->admin()->create();
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
        ]);

        $task->activityLogs()->create([
            'actor_id' => $manager->id,
            'action' => 'task_updated',
            'description' => 'Task details were updated.',
            'changes' => [
                'priority' => [
                    'from' => 'low',
                    'to' => 'high',
                ],
            ],
        ]);

        $response = $this
            ->actingAs($admin, 'api')
            ->getJson("/api/v1/tasks/{$task->uuid}/activity");

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.activity_logs.0.action',
                'task_updated',
            )
            ->assertJsonPath(
                'data.activity_logs.0.actor.id',
                $manager->uuid,
            );
    }

    public function test_team_lead_can_view_activity_for_their_team(): void
    {
        $owner = User::factory()->manager()->create();
        $lead = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $owner->id,
        ]);

        $team->members()->attach($lead->id, [
            'member_role' => 'lead',
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $owner->id,
        ]);

        $this
            ->actingAs($lead, 'api')
            ->getJson("/api/v1/tasks/{$task->uuid}/activity")
            ->assertOk();
    }

    public function test_non_lead_manager_cannot_view_activity(): void
    {
        $owner = User::factory()->manager()->create();
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $owner->id,
        ]);

        $team->members()->attach($manager->id, [
            'member_role' => 'member',
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $owner->id,
        ]);

        $this
            ->actingAs($manager, 'api')
            ->getJson("/api/v1/tasks/{$task->uuid}/activity")
            ->assertForbidden();
    }

    public function test_assigned_member_cannot_view_activity_log(): void
    {
        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $member->id,
        ]);

        $this
            ->actingAs($member, 'api')
            ->getJson("/api/v1/tasks/{$task->uuid}/activity")
            ->assertForbidden();
    }

    public function test_task_update_creates_activity_log(): void
    {
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'assigned_to' => null,
            'priority' => 'low',
        ]);

        $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}", [
                'priority' => 'high',
            ])
            ->assertOk();

        $this->assertDatabaseHas('task_activity_logs', [
            'task_id' => $task->id,
            'actor_id' => $manager->id,
            'action' => 'task_updated',
        ]);
    }

    public function test_status_change_creates_activity_log(): void
    {
        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $member->id,
            'status' => 'pending',
        ]);

        $this
            ->actingAs($member, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}/status", [
                'status' => 'in_progress',
                'note' => 'Work started.',
            ])
            ->assertOk();

        $this->assertDatabaseHas('task_activity_logs', [
            'task_id' => $task->id,
            'actor_id' => $member->id,
            'action' => 'status_changed',
        ]);
    }

    public function test_adding_comment_creates_activity_log(): void
    {
        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $member->id,
        ]);

        $this
            ->actingAs($member, 'api')
            ->postJson("/api/v1/tasks/{$task->uuid}/comments", [
                'body' => 'Waiting for deployment approval.',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('task_activity_logs', [
            'task_id' => $task->id,
            'actor_id' => $member->id,
            'action' => 'comment_added',
        ]);
    }
}
