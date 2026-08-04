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
            ->getJson("/api/v1/internal/users/{$user->uuid}");

        $response
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->uuid)
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
                'id' => $team->uuid,
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
            ->getJson("/api/v1/internal/teams/{$team->uuid}");

        $response
            ->assertOk()
            ->assertJsonPath('data.team.id', $team->uuid)
            ->assertJsonFragment([
                'id' => $member->uuid,
                'email' => $member->email,
            ]);
    }

    public function test_internal_teams_endpoint_filters_managed_teams(): void
    {
        $manager = User::factory()->manager()->create();
        $otherManager = User::factory()->manager()->create();

        $createdTeam = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $leadTeam = Team::factory()->create([
            'created_by' => $otherManager->id,
        ]);

        $leadTeam->members()->attach($manager->id, [
            'member_role' => 'lead',
        ]);

        $regularMemberTeam = Team::factory()->create([
            'created_by' => $otherManager->id,
        ]);

        $regularMemberTeam->members()->attach($manager->id, [
            'member_role' => 'member',
        ]);

        $unrelatedTeam = Team::factory()->create([
            'created_by' => $otherManager->id,
        ]);

        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson(
                '/api/v1/internal/teams'
                ."?managed_by={$manager->uuid}"
                .'&per_page=100',
            );

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonFragment([
                'id' => $createdTeam->uuid,
            ])
            ->assertJsonFragment([
                'id' => $leadTeam->uuid,
            ])
            ->assertJsonMissing([
                'id' => $regularMemberTeam->uuid,
            ])
            ->assertJsonMissing([
                'id' => $unrelatedTeam->uuid,
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
                ."?team_id={$team->uuid}"
                .'&status=pending'
                .'&priority=high'
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $task->uuid);
    }

    public function test_internal_tasks_endpoint_filters_by_assignee_uuid(): void
    {
        $manager = User::factory()->manager()->create();
        $assignedMember = User::factory()->teamMember()->create();
        $otherMember = User::factory()->teamMember()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $assignedTask = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'assigned_to' => $assignedMember->id,
        ]);

        Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
            'assigned_to' => $otherMember->id,
        ]);

        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson(
                '/api/v1/internal/tasks'
                ."?assigned_to={$assignedMember->uuid}"
                .'&per_page=100',
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $assignedTask->uuid)
            ->assertJsonPath(
                'data.0.assigned_to',
                $assignedMember->uuid,
            );
    }

    public function test_internal_tasks_endpoint_supports_created_date_range(): void
    {
        $team = Team::factory()->create();

        $insideRange = Task::factory()->create([
            'team_id' => $team->id,
            'created_at' => '2026-08-10 08:00:00',
        ]);

        Task::factory()->create([
            'team_id' => $team->id,
            'created_at' => '2026-07-20 08:00:00',
        ]);

        Task::factory()->create([
            'team_id' => $team->id,
            'created_at' => '2026-09-10 08:00:00',
        ]);

        $response = $this
            ->withHeader(
                'X-Service-Key',
                $this->serviceKey,
            )
            ->getJson(
                '/api/v1/internal/tasks'
                .'?date_from=2026-08-01'
                .'&date_to=2026-08-31'
                .'&per_page=100',
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $insideRange->uuid,
            );
    }

    public function test_internal_task_detail_returns_status_history(): void
    {
        $task = Task::factory()->create();

        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson("/api/v1/internal/tasks/{$task->uuid}");

        $response
            ->assertOk()
            ->assertJsonPath('data.task.id', $task->uuid)
            ->assertJsonStructure([
                'data' => [
                    'task' => [
                        'status_histories',
                    ],
                ],
            ]);
    }

    public function test_internal_teams_endpoint_can_filter_by_user_membership(): void
    {
        $manager = User::factory()->create([
            'role' => 'manager',
        ]);

        $otherManager = User::factory()->create([
            'role' => 'manager',
        ]);

        $createdTeam = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $joinedTeam = Team::factory()->create([
            'created_by' => $otherManager->id,
        ]);

        $unrelatedTeam = Team::factory()->create([
            'created_by' => $otherManager->id,
        ]);

        $joinedTeam->members()->attach($manager->id, [
            'member_role' => 'member',
        ]);

        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson(
                "/api/v1/internal/teams?user_id={$manager->uuid}&per_page=100",
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Internal teams retrieved successfully.',
            );

        $teamIds = collect($response->json('data'))
            ->pluck('id');

        $this->assertTrue($teamIds->contains($createdTeam->uuid));
        $this->assertTrue($teamIds->contains($joinedTeam->uuid));
        $this->assertFalse($teamIds->contains($unrelatedTeam->uuid));
    }
}
