<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\TaskActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaskActivityLog>
 */
class TaskActivityLogFactory extends Factory
{
    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'actor_id' => User::factory(),
            'action' => 'task_updated',
            'description' => fake()->sentence(),
            'changes' => [
                'priority' => [
                    'from' => 'low',
                    'to' => 'high',
                ],
            ],
        ];
    }
}
