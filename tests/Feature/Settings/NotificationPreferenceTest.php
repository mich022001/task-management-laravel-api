<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationPreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_retrieve_notification_preferences(): void
    {
        $user = User::factory()->create([
            'email_notifications_enabled' => false,
        ]);

        $this
            ->actingAs($user, 'api')
            ->getJson('/api/v1/settings/notifications')
            ->assertOk()
            ->assertJsonPath(
                'data.email_notifications_enabled',
                false,
            );
    }

    public function test_email_notifications_are_enabled_by_default(): void
    {
        $user = User::factory()->create();

        $this->assertTrue($user->email_notifications_enabled);

        $this
            ->actingAs($user, 'api')
            ->getJson('/api/v1/settings/notifications')
            ->assertOk()
            ->assertJsonPath(
                'data.email_notifications_enabled',
                true,
            );
    }

    public function test_authenticated_user_can_disable_email_notifications(): void
    {
        $user = User::factory()->create([
            'email_notifications_enabled' => true,
        ]);

        $this
            ->actingAs($user, 'api')
            ->patchJson('/api/v1/settings/notifications', [
                'email_notifications_enabled' => false,
            ])
            ->assertOk()
            ->assertJsonPath(
                'data.email_notifications_enabled',
                false,
            );

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email_notifications_enabled' => false,
        ]);
    }

    public function test_authenticated_user_can_enable_email_notifications(): void
    {
        $user = User::factory()
            ->emailNotificationsDisabled()
            ->create();

        $this
            ->actingAs($user, 'api')
            ->patchJson('/api/v1/settings/notifications', [
                'email_notifications_enabled' => true,
            ])
            ->assertOk()
            ->assertJsonPath(
                'data.email_notifications_enabled',
                true,
            );

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email_notifications_enabled' => true,
        ]);
    }

    public function test_notification_preference_requires_a_boolean(): void
    {
        $user = User::factory()->create();

        $this
            ->actingAs($user, 'api')
            ->patchJson('/api/v1/settings/notifications', [
                'email_notifications_enabled' => 'sometimes',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email_notifications_enabled',
            ]);
    }

    public function test_notification_preference_field_is_required(): void
    {
        $user = User::factory()->create();

        $this
            ->actingAs($user, 'api')
            ->patchJson('/api/v1/settings/notifications', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email_notifications_enabled',
            ]);
    }

    public function test_notification_preference_routes_require_authentication(): void
    {
        $this
            ->getJson('/api/v1/settings/notifications')
            ->assertUnauthorized();

        $this
            ->patchJson('/api/v1/settings/notifications', [
                'email_notifications_enabled' => false,
            ])
            ->assertUnauthorized();
    }

    public function test_user_can_only_change_their_own_preference(): void
    {
        $currentUser = User::factory()->create([
            'email_notifications_enabled' => true,
        ]);

        $otherUser = User::factory()->create([
            'email_notifications_enabled' => true,
        ]);

        $this
            ->actingAs($currentUser, 'api')
            ->patchJson('/api/v1/settings/notifications', [
                'email_notifications_enabled' => false,
            ])
            ->assertOk();

        $this->assertFalse(
            $currentUser->fresh()->email_notifications_enabled,
        );

        $this->assertTrue(
            $otherUser->fresh()->email_notifications_enabled,
        );
    }

    public function test_authenticated_user_resource_exposes_email_notification_preference(): void
    {
        $user = User::factory()->create([
            'email_notifications_enabled' => false,
        ]);

        $this
            ->actingAs($user, 'api')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath(
                'data.user.email_notifications_enabled',
                false,
            );
    }
}
