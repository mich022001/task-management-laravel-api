<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskStatusHistory;
use App\Models\User;

class TaskNotificationService
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function assignment(
        Task $task,
        User $recipient,
        string $eventKey,
    ): void {
        $this->notificationService->create(
            recipient: $recipient,
            type: 'task_assigned',
            title: 'New task assigned',
            message: sprintf(
                'You were assigned to the task "%s".',
                $task->title,
            ),
            task: $task,
            data: [
                'status' => $task->status,
                'priority' => $task->priority,
                'due_date' => $task->due_date?->toISOString(),
            ],
            deduplicationKey: sprintf(
                'task:%s:assignment:%s:%s',
                $task->uuid,
                $recipient->uuid,
                $eventKey,
            ),
        );
    }

    public function statusChanged(
        Task $task,
        TaskStatusHistory $history,
        User $actor,
    ): void {
        $creator = $task->creator;

        if (! $creator || $creator->is($actor)) {
            return;
        }

        $type = match ($history->new_status) {
            'completed' => 'task_completed',
            'cancelled' => 'task_cancelled',
            default => 'task_status_changed',
        };

        $title = match ($history->new_status) {
            'completed' => 'Task completed',
            'cancelled' => 'Task cancelled',
            default => 'Task status changed',
        };

        $message = sprintf(
            '%s changed the task "%s" from %s to %s.',
            $actor->name,
            $task->title,
            $this->formatStatus($history->previous_status),
            $this->formatStatus($history->new_status),
        );

        $this->notificationService->create(
            recipient: $creator,
            type: $type,
            title: $title,
            message: $message,
            task: $task,
            data: [
                'previous_status' => $history->previous_status,
                'new_status' => $history->new_status,
                'changed_by' => $actor->uuid,
                'note' => $history->note,
            ],
            deduplicationKey: sprintf(
                'task:%s:status-history:%s',
                $task->uuid,
                $history->uuid,
            ),
        );
    }

    private function formatStatus(string $status): string
    {
        return str_replace('_', ' ', $status);
    }
}
