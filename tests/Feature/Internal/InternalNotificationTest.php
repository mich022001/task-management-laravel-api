<?php

namespace Tests\Feature\Internal;

use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InternalNotificationTest extends TestCase
{
    use RefreshDatabase;

    private string $serviceKey = 'test-internal-service-key-1234567890';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set(
            'internal.service_key',
            $this->serviceKey,
        );
    }

    public function test_internal_service_can_create_task_notification(): void
    {
        $recipient = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $recipient->id,
        ]);

        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->postJson('/api/v1/internal/notifications', [
                'user_id' => $recipient->uuid,
                'task_id' => $task->uuid,
                'type' => 'task_assigned',
                'title' => 'New task assigned',
                'message' => 'A new task has been assigned to you.',
                'data' => [
                    'task_status' => $task->status,
                ],
                'deduplication_key' => "task-assigned:{$task->uuid}",
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath(
                'message',
                'Notification created successfully.',
            )
            ->assertJsonPath(
                'data.notification.task_id',
                $task->uuid,
            )
            ->assertJsonPath(
                'data.notification.type',
                'task_assigned',
            )
            ->assertJsonPath(
                'data.notification.is_read',
                false,
            );

        $this->assertDatabaseHas('notifications', [
            'user_id' => $recipient->id,
            'task_id' => $task->id,
            'type' => 'task_assigned',
            'deduplication_key' => "task-assigned:{$task->uuid}",
        ]);
    }

    public function test_internal_notification_requires_service_key(): void
    {
        $recipient = User::factory()->teamMember()->create();

        $this
            ->postJson('/api/v1/internal/notifications', [
                'user_id' => $recipient->uuid,
                'type' => 'custom',
                'title' => 'Test',
                'message' => 'Test message.',
            ])
            ->assertUnauthorized();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_internal_notification_validates_public_uuids(): void
    {
        $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->postJson('/api/v1/internal/notifications', [
                'user_id' => 15,
                'task_id' => 25,
                'type' => 'task_assigned',
                'title' => 'Invalid notification',
                'message' => 'Invalid identifiers.',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'user_id',
                'task_id',
            ]);
    }

    public function test_internal_notification_rejects_unsupported_type(): void
    {
        $recipient = User::factory()->teamMember()->create();

        $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->postJson('/api/v1/internal/notifications', [
                'user_id' => $recipient->uuid,
                'type' => 'unknown',
                'title' => 'Invalid notification',
                'message' => 'Unsupported notification type.',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('type');
    }

    public function test_deduplication_key_prevents_duplicate_notifications(): void
    {
        $recipient = User::factory()->teamMember()->create();

        $payload = [
            'user_id' => $recipient->uuid,
            'type' => 'deadline_upcoming',
            'title' => 'Task deadline approaching',
            'message' => 'The task is due within 24 hours.',
            'deduplication_key' => 'deadline-reminder:sample-task',
        ];

        $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->postJson('/api/v1/internal/notifications', $payload)
            ->assertCreated();

        $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->postJson('/api/v1/internal/notifications', [
                ...$payload,
                'message' => 'Updated reminder message.',
            ])
            ->assertCreated();

        $this->assertDatabaseCount('notifications', 1);

        $notification = Notification::query()->firstOrFail();

        $this->assertSame(
            'Updated reminder message.',
            $notification->message,
        );
    }
}
