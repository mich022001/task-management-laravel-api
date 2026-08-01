<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        $status = fake()->randomElement([
            'pending',
            'in_progress',
            'completed',
            'cancelled',
        ]);

        return [
            'team_id' => Team::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => $status,
            'priority' => fake()->randomElement([
                'low',
                'medium',
                'high',
            ]),
            'assigned_to' => User::factory()->teamMember(),
            'created_by' => User::factory()->manager(),
            'due_date' => fake()->optional()->dateTimeBetween('now', '+30 days'),
            'completed_at' => $status === 'completed'
                ? fake()->dateTimeBetween('-30 days', 'now')
                : null,
        ];
    }
}
