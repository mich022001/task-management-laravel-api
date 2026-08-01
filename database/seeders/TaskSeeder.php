<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $manager = User::query()
            ->where('email', 'manager@test.com')
            ->firstOrFail();

        $member = User::query()
            ->where('email', 'member@test.com')
            ->firstOrFail();

        $engineering = Team::query()
            ->where('name', 'Engineering')
            ->firstOrFail();

        Task::query()->updateOrCreate(
            [
                'team_id' => $engineering->id,
                'title' => 'Setup database',
            ],
            [
                'description' => 'Configure the project database.',
                'status' => 'in_progress',
                'priority' => 'high',
                'assigned_to' => $member->id,
                'created_by' => $manager->id,
                'due_date' => now()->addDays(3),
            ],
        );

        Task::query()->updateOrCreate(
            [
                'team_id' => $engineering->id,
                'title' => 'Write API docs',
            ],
            [
                'description' => 'Document the Laravel and Node.js APIs.',
                'status' => 'pending',
                'priority' => 'medium',
                'assigned_to' => $member->id,
                'created_by' => $manager->id,
                'due_date' => now()->addDays(7),
            ],
        );

        Task::query()->updateOrCreate(
            [
                'team_id' => $engineering->id,
                'title' => 'Fix login bug',
            ],
            [
                'description' => 'Resolve authentication issue.',
                'status' => 'completed',
                'priority' => 'high',
                'assigned_to' => $member->id,
                'created_by' => $manager->id,
                'due_date' => now()->subDay(),
                'completed_at' => now(),
            ],
        );

        Task::query()->updateOrCreate(
            [
                'team_id' => $engineering->id,
                'title' => 'Design dashboard',
            ],
            [
                'description' => 'Create the initial dashboard interface.',
                'status' => 'in_progress',
                'priority' => 'medium',
                'assigned_to' => $member->id,
                'created_by' => $manager->id,
                'due_date' => now()->addDays(5),
            ],
        );
    }
}
