<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskTransitionService
{
    /**
     * Allowed task status transitions.
     *
     * @var array<string, array<int, string>>
     */
    private const TRANSITIONS = [
        'pending' => [
            'in_progress',
            'cancelled',
        ],
        'in_progress' => [
            'pending',
            'completed',
            'cancelled',
        ],
        'completed' => [],
        'cancelled' => [
            'pending',
        ],
    ];

    /**
     * Transition a task to a new status and record its history.
     *
     * @throws ValidationException
     */
    public function transition(
        Task $task,
        string $newStatus,
        User $changedBy,
    ): Task {
        return DB::transaction(function () use (
            $task,
            $newStatus,
            $changedBy,
        ) {
            /** @var Task $lockedTask */
            $lockedTask = Task::query()
                ->lockForUpdate()
                ->findOrFail($task->id);

            $previousStatus = $lockedTask->status;

            if ($previousStatus === $newStatus) {
                throw ValidationException::withMessages([
                    'status' => 'The task already has the requested status.',
                ]);
            }

            $allowedStatuses = self::TRANSITIONS[$previousStatus] ?? [];

            if (! in_array($newStatus, $allowedStatuses, true)) {
                throw ValidationException::withMessages([
                    'status' => sprintf(
                        'Transition from %s to %s is not allowed.',
                        $previousStatus,
                        $newStatus,
                    ),
                ]);
            }

            $lockedTask->update([
                'status' => $newStatus,
                'completed_at' => $newStatus === 'completed'
                    ? now()
                    : null,
            ]);

            $lockedTask->statusHistories()->create([
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
                'changed_by' => $changedBy->id,
            ]);

            return $lockedTask->fresh([
                'team',
                'assignee',
                'creator',
                'statusHistories.changedBy',
            ]);
        });
    }

    /**
     * Return the valid next statuses for a task.
     *
     * @return array<int, string>
     */
    public function allowedTransitions(Task $task): array
    {
        return self::TRANSITIONS[$task->status] ?? [];
    }
}
