<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\TaskStatusHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaskStatusHistory>
 */
class TaskStatusHistoryFactory extends Factory
{
    protected $model = TaskStatusHistory::class;

    public function definition(): array
    {
        $statuses = [
            'pending',
            'in_progress',
            'completed',
            'cancelled',
        ];

        $previous = fake()->randomElement($statuses);
        $next = fake()->randomElement(
            array_values(array_diff($statuses, [$previous]))
        );

        return [
            'task_id' => Task::factory(),
            'previous_status' => $previous,
            'new_status' => $next,
            'changed_by' => User::factory()->manager(),
        ];
    }
}
