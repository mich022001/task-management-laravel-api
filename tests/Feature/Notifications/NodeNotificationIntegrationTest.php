<?php

namespace Tests\Feature\Notifications;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NodeNotificationIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.node_notifications.url' => 'http://node.test/api/v1/notifications',

            'services.node_notifications.service_key' => 'node-service-key-for-laravel-tests',

            'services.node_notifications.timeout' => 5,
        ]);

        Http::preventStrayRequests();
    }

    public function test_task_assignment_calls_node_when_email_is_enabled(): void
    {
        Http::fake([
            'http://node.test/api/v1/notifications' => Http::response([
                'message' => 'Notification queued successfully.',
                'data' => [
                    'job' => [
                        'id' => 'job-assignment',
                    ],
                ],
            ], 202),
        ]);

        $manager = User::factory()->manager()->create();

        $member = User::factory()->teamMember()->create([
            'email_notifications_enabled' => true,
        ]);

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
                'title' => 'Email assignment test',
                'priority' => 'high',
            ]);

        $response->assertCreated();

        $task = Task::query()
            ->where('title', 'Email assignment test')
            ->firstOrFail();

        Http::assertSent(function (Request $request) use ($task) {
            return $request->url()
                    === 'http://node.test/api/v1/notifications'
                && $request->hasHeader(
                    'X-Service-Key',
                    'node-service-key-for-laravel-tests',
                )
                && $request['type'] === 'task_assigned'
                && $request['task_id'] === $task->uuid;
        });

        $this->assertDatabaseHas('notifications', [
            'user_id' => $member->id,
            'task_id' => $task->id,
            'type' => 'task_assigned',
        ]);
    }

    public function test_task_assignment_skips_node_when_email_is_disabled(): void
    {
        Http::fake();

        $manager = User::factory()->manager()->create();

        $member = User::factory()->teamMember()->create([
            'email_notifications_enabled' => false,
        ]);

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
                'title' => 'In-app only assignment',
                'priority' => 'medium',
            ])
            ->assertCreated();

        Http::assertNothingSent();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $member->id,
            'type' => 'task_assigned',
        ]);
    }

    public function test_reassignment_calls_node_for_new_assignee(): void
    {
        Http::fake([
            'http://node.test/api/v1/notifications' => Http::response([
                'data' => [
                    'job' => [
                        'id' => 'job-reassignment',
                    ],
                ],
            ], 202),
        ]);

        $manager = User::factory()->manager()->create();
        $oldMember = User::factory()->teamMember()->create();
        $newMember = User::factory()->teamMember()->create([
            'email_notifications_enabled' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $team->members()->attach([
            $oldMember->id => ['member_role' => 'member'],
            $newMember->id => ['member_role' => 'member'],
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'assigned_to' => $oldMember->id,
        ]);

        $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}", [
                'assigned_to' => $newMember->uuid,
            ])
            ->assertOk();

        Http::assertSentCount(1);

        Http::assertSent(
            fn (Request $request) => $request['type'] === 'task_assigned'
                && $request['task_id'] === $task->uuid,
        );
    }

    public function test_status_change_calls_node_for_creator(): void
    {
        Http::fake([
            'http://node.test/api/v1/notifications' => Http::response([
                'data' => [
                    'job' => [
                        'id' => 'job-status',
                    ],
                ],
            ], 202),
        ]);

        $manager = User::factory()->manager()->create([
            'email_notifications_enabled' => true,
        ]);

        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'created_by' => $manager->id,
            'assigned_to' => $member->id,
            'status' => 'pending',
            'completed_at' => null,
        ]);

        $this
            ->actingAs($member, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}/status", [
                'status' => 'in_progress',
            ])
            ->assertOk();

        Http::assertSent(
            fn (Request $request) => $request['type'] === 'task_status_changed'
                && $request['task_id'] === $task->uuid
                && $request['previous_status'] === 'pending'
                && $request['new_status'] === 'in_progress',
        );
    }

    public function test_completion_calls_node_with_completion_type(): void
    {
        Http::fake([
            'http://node.test/api/v1/notifications' => Http::response([
                'data' => [
                    'job' => [
                        'id' => 'job-completed',
                    ],
                ],
            ], 202),
        ]);

        $manager = User::factory()->manager()->create([
            'email_notifications_enabled' => true,
        ]);

        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
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

        Http::assertSent(
            fn (Request $request) => $request['type'] === 'task_completed'
                && $request['task_id'] === $task->uuid,
        );
    }

    public function test_node_failure_does_not_roll_back_task_creation(): void
    {
        Http::fake([
            'http://node.test/api/v1/notifications' => Http::response([
                'message' => 'Node service unavailable.',
            ], 503),
        ]);

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
                'title' => 'Node failure test',
                'priority' => 'medium',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('tasks', [
            'title' => 'Node failure test',
            'assigned_to' => $member->id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $member->id,
            'type' => 'task_assigned',
        ]);
    }

    public function test_creator_does_not_receive_email_for_their_own_status_change(): void
    {
        Http::fake();

        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'status' => 'pending',
            'completed_at' => null,
        ]);

        $this
            ->actingAs($manager, 'api')
            ->patchJson("/api/v1/tasks/{$task->uuid}/status", [
                'status' => 'in_progress',
            ])
            ->assertOk();

        Http::assertNothingSent();
    }
}
