<?php

namespace Tests\Feature\Notifications;

use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_only_their_unread_notifications(): void
    {
        $user = User::factory()->teamMember()->create();
        $otherUser = User::factory()->teamMember()->create();

        Notification::factory()
            ->for($user)
            ->unread()
            ->create([
                'title' => 'Your unread notification',
            ]);

        Notification::factory()
            ->for($user)
            ->read()
            ->create([
                'title' => 'Your read notification',
            ]);

        Notification::factory()
            ->for($otherUser)
            ->unread()
            ->create([
                'title' => 'Another user notification',
            ]);

        $this
            ->actingAs($user, 'api')
            ->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Notifications retrieved successfully.',
            )
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.title',
                'Your unread notification',
            )
            ->assertJsonPath('meta.unread_count', 1)
            ->assertJsonMissing([
                'title' => 'Your read notification',
            ])
            ->assertJsonMissing([
                'title' => 'Another user notification',
            ]);
    }

    public function test_user_can_include_read_notifications(): void
    {
        $user = User::factory()->teamMember()->create();

        Notification::factory()
            ->for($user)
            ->unread()
            ->create();

        Notification::factory()
            ->for($user)
            ->read()
            ->create();

        $this
            ->actingAs($user, 'api')
            ->getJson('/api/v1/notifications?include_read=true')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.unread_count', 1);
    }

    public function test_user_can_retrieve_their_unread_count(): void
    {
        $user = User::factory()->teamMember()->create();

        Notification::factory()
            ->count(3)
            ->for($user)
            ->unread()
            ->create();

        Notification::factory()
            ->for($user)
            ->read()
            ->create();

        $this
            ->actingAs($user, 'api')
            ->getJson('/api/v1/notifications/unread-count')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 3);
    }

    public function test_user_can_mark_their_notification_as_read(): void
    {
        $user = User::factory()->teamMember()->create();

        $notification = Notification::factory()
            ->for($user)
            ->unread()
            ->create();

        $this
            ->actingAs($user, 'api')
            ->patchJson(
                "/api/v1/notifications/{$notification->uuid}/read",
            )
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Notification marked as read.',
            )
            ->assertJsonPath(
                'data.notification.is_read',
                true,
            );

        $this->assertNotNull(
            $notification->fresh()->read_at,
        );
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $user = User::factory()->teamMember()->create();
        $otherUser = User::factory()->teamMember()->create();

        $notification = Notification::factory()
            ->for($otherUser)
            ->unread()
            ->create();

        $this
            ->actingAs($user, 'api')
            ->patchJson(
                "/api/v1/notifications/{$notification->uuid}/read",
            )
            ->assertNotFound();

        $this->assertNull(
            $notification->fresh()->read_at,
        );
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->teamMember()->create();

        Notification::factory()
            ->count(3)
            ->for($user)
            ->unread()
            ->create();

        $this
            ->actingAs($user, 'api')
            ->patchJson('/api/v1/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('data.updated_count', 3);

        $this->assertSame(
            0,
            $user->notifications()
                ->whereNull('read_at')
                ->count(),
        );
    }

    public function test_user_can_remove_one_notification(): void
    {
        $user = User::factory()->teamMember()->create();

        $notification = Notification::factory()
            ->for($user)
            ->create();

        $this
            ->actingAs($user, 'api')
            ->deleteJson(
                "/api/v1/notifications/{$notification->uuid}",
            )
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Notification removed successfully.',
            );

        $this->assertDatabaseMissing('notifications', [
            'id' => $notification->id,
        ]);
    }

    public function test_user_can_clear_all_their_notifications_only(): void
    {
        $user = User::factory()->teamMember()->create();
        $otherUser = User::factory()->teamMember()->create();

        Notification::factory()
            ->count(3)
            ->for($user)
            ->create();

        $otherNotification = Notification::factory()
            ->for($otherUser)
            ->create();

        $this
            ->actingAs($user, 'api')
            ->deleteJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonPath('data.deleted_count', 3);

        $this->assertSame(
            0,
            $user->notifications()->count(),
        );

        $this->assertDatabaseHas('notifications', [
            'id' => $otherNotification->id,
        ]);
    }

    public function test_notification_resource_returns_public_task_uuid(): void
    {
        $user = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $user->id,
        ]);

        Notification::factory()
            ->for($user)
            ->forTask($task)
            ->create();

        $this
            ->actingAs($user, 'api')
            ->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonPath('data.0.task_id', $task->uuid)
            ->assertJsonPath('data.0.task.id', $task->uuid);
    }

    public function test_notification_routes_require_authentication(): void
    {
        $this
            ->getJson('/api/v1/notifications')
            ->assertUnauthorized();

        $this
            ->getJson('/api/v1/notifications/unread-count')
            ->assertUnauthorized();

        $this
            ->patchJson('/api/v1/notifications/read-all')
            ->assertUnauthorized();

        $this
            ->deleteJson('/api/v1/notifications')
            ->assertUnauthorized();
    }
}
