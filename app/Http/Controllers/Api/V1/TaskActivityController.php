<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskActivityLogResource;
use App\Http\Resources\TaskStatusHistoryResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class TaskActivityController extends Controller
{
    public function __invoke(Task $task): JsonResponse
    {
        Gate::authorize('viewActivity', $task);

        $activityLogs = $task->activityLogs()
            ->with('actor')
            ->latest()
            ->get();

        $statusHistories = $task->statusHistories()
            ->with('changedBy')
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Task activity retrieved successfully.',
            'data' => [
                'activity_logs' => TaskActivityLogResource::collection(
                    $activityLogs,
                ),
                'status_histories' => TaskStatusHistoryResource::collection(
                    $statusHistories,
                ),
            ],
        ]);
    }
}
