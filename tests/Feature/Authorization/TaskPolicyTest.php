<?php

namespace Tests\Feature\Authorization;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskPolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_any_task(): void
    {
        $admin = User::factory()->admin()->create();
        $task = Task::factory()->create();

        $this->assertTrue($admin->can('view', $task));
    }

    public function test_manager_can_view_task_in_their_team(): void
    {
        $manager = User::factory()->manager()->create();

        $team = Team::factory()->create([
            'created_by' => $manager->id,
        ]);

        $task = Task::factory()->create([
            'team_id' => $team->id,
            'created_by' => $manager->id,
        ]);

        $this->assertTrue($manager->can('view', $task));
    }

    public function test_team_member_can_view_assigned_task(): void
    {
        $member = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $member->id,
        ]);

        $this->assertTrue($member->can('view', $task));
    }

    public function test_team_member_cannot_view_unassigned_task(): void
    {
        $member = User::factory()->teamMember()->create();
        $otherMember = User::factory()->teamMember()->create();

        $task = Task::factory()->create([
            'assigned_to' => $otherMember->id,
        ]);

        $this->assertFalse($member->can('view', $task));
    }

    public function test_only_admin_or_task_creator_can_delete_task(): void
    {
        $creator = User::factory()->manager()->create();
        $otherManager = User::factory()->manager()->create();

        $task = Task::factory()->create([
            'created_by' => $creator->id,
        ]);

        $this->assertTrue($creator->can('delete', $task));
        $this->assertFalse($otherManager->can('delete', $task));
    }
}
