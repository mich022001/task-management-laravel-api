<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Task\StoreTaskCommentRequest;
use App\Http\Resources\TaskCommentResource;
use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TaskCommentController extends Controller
{
    public function index(Task $task): JsonResponse
    {
        Gate::authorize('view', $task);

        $comments = $task->comments()
            ->with('user')
            ->oldest()
            ->get();

        return response()->json([
            'message' => 'Task comments retrieved successfully.',
            'data' => TaskCommentResource::collection($comments),
        ]);
    }

    public function store(
        StoreTaskCommentRequest $request,
        Task $task,
    ): JsonResponse {
        $currentUser = auth('api')->user();

        $comment = DB::transaction(function () use (
            $request,
            $task,
            $currentUser,
        ): TaskComment {
            $comment = $task->comments()->create([
                'user_id' => $currentUser->id,
                'body' => $request->validated('body'),
            ]);

            $task->activityLogs()->create([
                'actor_id' => $currentUser->id,
                'action' => 'comment_added',
                'description' => sprintf(
                    '%s added a task comment.',
                    $currentUser->name,
                ),
                'changes' => null,
            ]);

            return $comment;
        });

        $comment->load('user');

        return response()->json([
            'message' => 'Task comment added successfully.',
            'data' => [
                'comment' => new TaskCommentResource($comment),
            ],
        ], 201);
    }
}
