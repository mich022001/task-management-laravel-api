<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'task_id' => null,
            'type' => 'custom',
            'title' => fake()->sentence(4),
            'message' => fake()->sentence(),
            'data' => [],
            'deduplication_key' => null,
            'read_at' => null,
        ];
    }

    public function forTask(?Task $task = null): static
    {
        return $this->state(fn () => [
            'task_id' => $task?->id ?? Task::factory(),
        ]);
    }

    public function read(): static
    {
        return $this->state(fn () => [
            'read_at' => now(),
        ]);
    }

    public function unread(): static
    {
        return $this->state(fn () => [
            'read_at' => null,
        ]);
    }
}
