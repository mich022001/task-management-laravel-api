<?php

namespace Tests\Feature\PublicIdentifiers;

use App\Models\Task;
use App\Models\TaskActivityLog;
use App\Models\TaskComment;
use App\Models\TaskStatusHistory;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicIdentifierTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_receive_unique_uuids(): void
    {
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();

        $this->assertTrue(Str::isUuid($firstUser->uuid));
        $this->assertTrue(Str::isUuid($secondUser->uuid));
        $this->assertNotSame($firstUser->uuid, $secondUser->uuid);

        $this->assertDatabaseHas('users', [
            'id' => $firstUser->id,
            'uuid' => $firstUser->uuid,
        ]);
    }

    public function test_teams_receive_unique_uuids(): void
    {
        $firstTeam = Team::factory()->create();
        $secondTeam = Team::factory()->create();

        $this->assertTrue(Str::isUuid($firstTeam->uuid));
        $this->assertTrue(Str::isUuid($secondTeam->uuid));
        $this->assertNotSame($firstTeam->uuid, $secondTeam->uuid);
    }

    public function test_tasks_receive_unique_uuids(): void
    {
        $firstTask = Task::factory()->create();
        $secondTask = Task::factory()->create();

        $this->assertTrue(Str::isUuid($firstTask->uuid));
        $this->assertTrue(Str::isUuid($secondTask->uuid));
        $this->assertNotSame($firstTask->uuid, $secondTask->uuid);
    }

    public function test_integer_primary_keys_are_preserved_internally(): void
    {
        $task = Task::factory()->create();

        $this->assertIsInt($task->id);
        $this->assertNotNull($task->team_id);
        $this->assertNotNull($task->created_by);
    }

    public function test_public_models_use_uuid_route_keys(): void
    {
        $user = User::factory()->create();
        $team = Team::factory()->create();
        $task = Task::factory()->create();

        $this->assertSame('uuid', $user->getRouteKeyName());
        $this->assertSame('uuid', $team->getRouteKeyName());
        $this->assertSame('uuid', $task->getRouteKeyName());

        $this->assertSame($user->uuid, $user->getRouteKey());
        $this->assertSame($team->uuid, $team->getRouteKey());
        $this->assertSame($task->uuid, $task->getRouteKey());
    }

    public function test_jwt_subject_uses_user_uuid(): void
    {
        $user = User::factory()->create([
            'email' => 'uuid-auth@example.com',
            'password' => 'password123',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'uuid-auth@example.com',
            'password' => 'password123',
        ]);

        $response->assertOk();

        $token = $response->json('data.access_token');

        $payload = auth('api')
            ->setToken($token)
            ->payload();

        $this->assertSame($user->uuid, $payload->get('sub'));
    }

    public function test_task_route_binding_uses_uuid_instead_of_integer_id(): void
    {
        $admin = User::factory()->admin()->create();
        $task = Task::factory()->create();

        $this
            ->actingAs($admin, 'api')
            ->getJson("/api/v1/tasks/{$task->uuid}")
            ->assertOk();

        $this
            ->actingAs($admin, 'api')
            ->getJson("/api/v1/tasks/{$task->id}")
            ->assertNotFound();
    }

    public function test_task_comments_receive_unique_uuids(): void
    {
        $firstComment = TaskComment::factory()->create();
        $secondComment = TaskComment::factory()->create();

        $this->assertTrue(Str::isUuid($firstComment->uuid));
        $this->assertTrue(Str::isUuid($secondComment->uuid));
        $this->assertNotSame(
            $firstComment->uuid,
            $secondComment->uuid,
        );
    }

    public function test_task_status_histories_receive_unique_uuids(): void
    {
        $task = Task::factory()->create();
        $user = User::factory()->create();

        $firstHistory = TaskStatusHistory::query()->create([
            'task_id' => $task->id,
            'previous_status' => null,
            'new_status' => 'pending',
            'note' => null,
            'changed_by' => $user->id,
        ]);

        $secondHistory = TaskStatusHistory::query()->create([
            'task_id' => $task->id,
            'previous_status' => 'pending',
            'new_status' => 'in_progress',
            'note' => 'Development started.',
            'changed_by' => $user->id,
        ]);

        $this->assertTrue(Str::isUuid($firstHistory->uuid));
        $this->assertTrue(Str::isUuid($secondHistory->uuid));
        $this->assertNotSame(
            $firstHistory->uuid,
            $secondHistory->uuid,
        );
    }

    public function test_task_activity_logs_receive_unique_uuids(): void
    {
        $firstLog = TaskActivityLog::factory()->create();
        $secondLog = TaskActivityLog::factory()->create();

        $this->assertTrue(Str::isUuid($firstLog->uuid));
        $this->assertTrue(Str::isUuid($secondLog->uuid));
        $this->assertNotSame(
            $firstLog->uuid,
            $secondLog->uuid,
        );
    }
}
