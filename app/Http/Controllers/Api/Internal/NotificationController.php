<?php

namespace App\Http\Controllers\Api\Internal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\StoreInternalNotificationRequest;
use App\Http\Resources\NotificationResource;
use App\Models\Task;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function store(
        StoreInternalNotificationRequest $request,
    ): JsonResponse {
        $validated = $request->validated();

        $recipient = User::query()
            ->where('uuid', $validated['user_id'])
            ->firstOrFail();

        $task = isset($validated['task_id'])
            ? Task::query()
                ->where('uuid', $validated['task_id'])
                ->firstOrFail()
            : null;

        $notification = $this->notificationService->create(
            recipient: $recipient,
            type: $validated['type'],
            title: $validated['title'],
            message: $validated['message'],
            task: $task,
            data: $validated['data'] ?? [],
            deduplicationKey: $validated['deduplication_key'] ?? null,
        );

        $notification->load('task');

        return response()->json([
            'message' => 'Notification created successfully.',
            'data' => [
                'notification' => new NotificationResource($notification),
            ],
        ], 201);
    }
}
