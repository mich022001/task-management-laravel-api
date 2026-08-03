<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Task;
use App\Models\User;

class NotificationService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(
        User $recipient,
        string $type,
        string $title,
        string $message,
        ?Task $task = null,
        array $data = [],
        ?string $deduplicationKey = null,
    ): Notification {
        $attributes = [
            'user_id' => $recipient->id,
            'task_id' => $task?->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'read_at' => null,
        ];

        if ($deduplicationKey === null) {
            return Notification::query()->create($attributes);
        }

        return Notification::query()->updateOrCreate(
            [
                'deduplication_key' => $deduplicationKey,
            ],
            $attributes,
        );
    }
}
