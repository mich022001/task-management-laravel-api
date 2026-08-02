<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Task::class);

        $currentUser = auth('api')->user();

        $query = Task::query()
            ->with([
                'team.creator',
                'assignee',
                'creator',
            ]);

        if ($currentUser->role === 'manager') {
            $query->whereHas('team', function ($teamQuery) use ($currentUser) {
                $teamQuery
                    ->where('created_by', $currentUser->id)
                    ->orWhereHas(
                        'members',
                        fn ($memberQuery) => $memberQuery
                            ->where('users.id', $currentUser->id),
                    );
            });
        }

        if ($currentUser->role === 'team_member') {
            $query->where('assigned_to', $currentUser->id);
        }

        $query
            ->when(
                $request->filled('status'),
                fn ($builder) => $builder->where(
                    'status',
                    $request->string('status')->toString(),
                ),
            )
            ->when(
                $request->filled('priority'),
                fn ($builder) => $builder->where(
                    'priority',
                    $request->string('priority')->toString(),
                ),
            )
            ->when(
                $request->filled('team_id'),
                fn ($builder) => $builder->where(
                    'team_id',
                    $request->integer('team_id'),
                ),
            )
            ->when(
                $request->filled('assigned_to'),
                fn ($builder) => $builder->where(
                    'assigned_to',
                    $request->integer('assigned_to'),
                ),
            )
            ->when(
                $request->filled('search'),
                function ($builder) use ($request) {
                    $search = mb_strtolower(
                        trim($request->string('search')->toString()),
                    );

                    $builder->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->whereRaw(
                                'LOWER(title) LIKE ?',
                                ["%{$search}%"],
                            )
                            ->orWhereRaw(
                                'LOWER(description) LIKE ?',
                                ["%{$search}%"],
                            );
                    });
                },
            )
            ->latest();

        $perPage = min(
            max((int) $request->input('per_page', 15), 1),
            100,
        );

        $tasks = $query->paginate($perPage);

        return response()->json([
            'message' => 'Tasks retrieved successfully.',
            'data' => TaskResource::collection($tasks->items()),
            'meta' => [
                'current_page' => $tasks->currentPage(),
                'per_page' => $tasks->perPage(),
                'total' => $tasks->total(),
                'last_page' => $tasks->lastPage(),
            ],
        ]);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $currentUser = auth('api')->user();

        $task = DB::transaction(function () use (
            $validated,
            $currentUser,
        ) {
            return Task::query()->create([
                ...$validated,
                'status' => 'pending',
                'created_by' => $currentUser->id,
                'completed_at' => null,
            ]);
        });

        $task->load([
            'team.creator',
            'assignee',
            'creator',
        ]);

        return response()->json([
            'message' => 'Task created successfully.',
            'data' => [
                'task' => new TaskResource($task),
            ],
        ], 201);
    }

    public function show(Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        $task->load([
            'team.creator',
            'assignee',
            'creator',
            'statusHistories.changedBy',
        ]);

        return response()->json([
            'message' => 'Task retrieved successfully.',
            'data' => [
                'task' => new TaskResource($task),
            ],
        ]);
    }

    public function update(
        UpdateTaskRequest $request,
        Task $task,
    ): JsonResponse {
        $validated = $request->validated();

        DB::transaction(function () use ($task, $validated) {
            $task->update($validated);
        });

        $task->load([
            'team.creator',
            'assignee',
            'creator',
            'statusHistories.changedBy',
        ]);

        return response()->json([
            'message' => 'Task updated successfully.',
            'data' => [
                'task' => new TaskResource($task->fresh()),
            ],
        ]);
    }

    public function destroy(Task $task): JsonResponse
    {
        Gate::authorize('delete', $task);

        DB::transaction(function () use ($task) {
            $task->delete();
        });

        return response()->json([
            'message' => 'Task deleted successfully.',
        ]);
    }
}
