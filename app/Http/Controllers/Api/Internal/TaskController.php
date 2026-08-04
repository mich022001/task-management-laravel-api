<?php

namespace App\Http\Controllers\Api\Internal;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max($request->integer('per_page', 15), 1),
            100,
        );

        $relations = [
            'team.creator',
            'assignee',
            'creator',
        ];

        if ($request->boolean('include_report_context')) {
            $relations[] = 'statusHistories.changedBy';
            $relations[] = 'activityLogs.actor';
        }

        $tasks = Task::query()
            ->with($relations)
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where(
                    'status',
                    $request->string('status')->toString(),
                ),
            )
            ->when(
                $request->filled('priority'),
                fn ($query) => $query->where(
                    'priority',
                    $request->string('priority')->toString(),
                ),
            )
            ->when(
                $request->filled('team_id'),
                fn ($query) => $query->whereHas(
                    'team',
                    fn ($teamQuery) => $teamQuery->where(
                        'uuid',
                        $request->string('team_id')->toString(),
                    ),
                ),
            )
            ->when(
                $request->filled('assigned_to'),
                fn ($query) => $query->whereHas(
                    'assignee',
                    fn ($userQuery) => $userQuery->where(
                        'uuid',
                        $request->string('assigned_to')->toString(),
                    ),
                ),
            )
            ->when(
                $request->filled('date_from'),
                fn ($query) => $query->whereDate(
                    'created_at',
                    '>=',
                    $request->string('date_from')->toString(),
                ),
            )
            ->when(
                $request->filled('date_to'),
                fn ($query) => $query->whereDate(
                    'created_at',
                    '<=',
                    $request->string('date_to')->toString(),
                ),
            )
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'message' => 'Internal tasks retrieved successfully.',
            'data' => TaskResource::collection($tasks->items()),
            'meta' => [
                'current_page' => $tasks->currentPage(),
                'per_page' => $tasks->perPage(),
                'total' => $tasks->total(),
                'last_page' => $tasks->lastPage(),
            ],
        ]);
    }

    public function show(Task $task): JsonResponse
    {
        $task->load([
            'team.creator',
            'assignee',
            'creator',
            'statusHistories.changedBy',
        ]);

        return response()->json([
            'message' => 'Internal task retrieved successfully.',
            'data' => [
                'task' => new TaskResource($task),
            ],
        ]);
    }
}
