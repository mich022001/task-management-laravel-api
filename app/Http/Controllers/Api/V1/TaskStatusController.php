<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use App\Services\TaskTransitionService;
use Illuminate\Http\JsonResponse;

class TaskStatusController extends Controller
{
    public function __construct(
        private readonly TaskTransitionService $transitionService,
    ) {}

    public function __invoke(
        UpdateTaskStatusRequest $request,
        Task $task,
    ): JsonResponse {
        $updatedTask = $this->transitionService->transition(
            task: $task,
            newStatus: $request->validated('status'),
            changedBy: auth('api')->user(),
        );

        return response()->json([
            'message' => 'Task status updated successfully.',
            'data' => [
                'task' => new TaskResource($updatedTask),
            ],
        ]);
    }
}
