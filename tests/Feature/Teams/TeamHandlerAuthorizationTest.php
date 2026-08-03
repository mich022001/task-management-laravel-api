<?php

namespace Tests\Feature\Teams;

use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamHandlerAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_members_of_any_team(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $creator = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $creator->id,
        ]);

        $this->assertTrue(
            $admin->can('manageMembers', $team),
        );
    }

    public function test_assigned_manager_lead_can_manage_team_members(): void
    {
        $creator = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $handler = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $creator->id,
        ]);

        $team->members()->attach($handler->id, [
            'member_role' => 'lead',
        ]);

        $this->assertTrue(
            $handler->can('manageMembers', $team),
        );

        $this->assertTrue(
            $handler->can('update', $team),
        );
    }

    public function test_creator_cannot_manage_team_when_not_assigned_as_lead(): void
    {
        $creator = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $handler = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $creator->id,
        ]);

        $team->members()->attach($handler->id, [
            'member_role' => 'lead',
        ]);

        $this->assertTrue(
            $creator->can('view', $team),
        );

        $this->assertFalse(
            $creator->can('manageMembers', $team),
        );

        $this->assertFalse(
            $creator->can('update', $team),
        );
    }

    public function test_unassigned_manager_cannot_view_or_manage_team(): void
    {
        $creator = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $handler = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $unassignedManager = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $creator->id,
        ]);

        $team->members()->attach($handler->id, [
            'member_role' => 'lead',
        ]);

        $this->assertFalse(
            $unassignedManager->can('view', $team),
        );

        $this->assertFalse(
            $unassignedManager->can('manageMembers', $team),
        );

        $this->assertFalse(
            $unassignedManager->can('update', $team),
        );
    }

    public function test_manager_assigned_as_regular_member_cannot_manage_team(): void
    {
        $creator = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $manager = User::factory()->create([
            'role' => 'manager',
            'is_active' => true,
        ]);

        $team = Team::factory()->create([
            'created_by' => $creator->id,
        ]);

        $team->members()->attach($manager->id, [
            'member_role' => 'member',
        ]);

        $this->assertTrue(
            $manager->can('view', $team),
        );

        $this->assertFalse(
            $manager->can('manageMembers', $team),
        );

        $this->assertFalse(
            $manager->can('update', $team),
        );
    }
}
