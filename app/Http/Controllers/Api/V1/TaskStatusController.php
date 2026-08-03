<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\NodeNotificationService;
use App\Services\TaskTransitionService;
use Illuminate\Http\JsonResponse;

class TaskStatusController extends Controller
{
    public function __construct(
        private readonly TaskTransitionService $transitionService,
        private readonly NodeNotificationService $nodeNotificationService,
    ) {}

    public function __invoke(
        UpdateTaskStatusRequest $request,
        Task $task,
    ): JsonResponse {
        $validated = $request->validated();
        $actor = auth('api')->user();
        $previousStatus = $task->status;

        $updatedTask = $this->transitionService->transition(
            task: $task,
            newStatus: $validated['status'],
            changedBy: $actor,
            note: $validated['note'] ?? null,
        );

        $creator = $updatedTask->creator;

        if ($creator && ! $creator->is($actor)) {
            if ($updatedTask->status === 'completed') {
                $this->nodeNotificationService->taskCompleted(
                    task: $updatedTask,
                    recipient: $creator,
                );
            } else {
                $this->nodeNotificationService->taskStatusChanged(
                    task: $updatedTask,
                    recipient: $creator,
                    previousStatus: $previousStatus,
                    newStatus: $updatedTask->status,
                );
            }
        }

        return response()->json([
            'message' => 'Task status updated successfully.',
            'data' => [
                'task' => new TaskResource($updatedTask),
            ],
        ]);
    }
}
