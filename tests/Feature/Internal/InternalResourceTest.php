<?php

namespace Tests\Feature\Internal;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InternalResourceTest extends TestCase
{
    use RefreshDatabase;

    private string $serviceKey = 'testing-internal-service-key-1234567890';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'internal.service_key' => $this->serviceKey,
        ]);
    }

    public function test_internal_users_endpoint_returns_paginated_users(): void
    {
        User::factory()->count(3)->create();

        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson('/api/v1/internal/users?per_page=2');

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Internal users retrieved successfully.',
            )
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonCount(2, 'data');
    }

    public function test_internal_user_detail_endpoint_returns_user(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson("/api/v1/internal/users/{$user->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.email', $user->email);
    }

    public function test_internal_teams_endpoint_returns_team_data(): void
    {
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson('/api/v1/internal/teams');

        $response
            ->assertOk()
            ->assertJsonFragment([
                'id' => $team->id,
                'name' => $team->name,
            ]);
    }

    public function test_internal_team_detail_endpoint_returns_members(): void
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
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson("/api/v1/internal/teams/{$team->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.team.id', $team->id)
            ->assertJsonFragment([
                'id' => $member->id,
                'email' => $member->email,
            ]);
    }

    public function test_internal_tasks_endpoint_supports_filters(): void
    {
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'status' => 'pending',
            'priority' => 'high',
        ]);

        Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'status' => 'completed',
            'priority' => 'low',
        ]);

        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson(
                '/api/v1/internal/tasks'
                ."?team_id={$team->id}"
                .'&status=pending'
                .'&priority=high'
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $task->id);
    }

    public function test_internal_task_detail_returns_status_history(): void
    {
        $task = Task::factory()->create();

        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson("/api/v1/internal/tasks/{$task->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.task.id', $task->id)
            ->assertJsonStructure([
                'data' => [
                    'task' => [
                        'status_histories',
                    ],
                ],
            ]);
    }
}
