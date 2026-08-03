<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentUser = auth('api')->user();

        $query = $currentUser->notifications()
            ->with('task')
            ->latest();

        if (! $request->boolean('include_read')) {
            $query->whereNull('read_at');
        }

        $perPage = min(
            max((int) $request->input('per_page', 20), 1),
            100,
        );

        $notifications = $query->paginate($perPage);

        return response()->json([
            'message' => 'Notifications retrieved successfully.',
            'data' => NotificationResource::collection(
                $notifications->items(),
            ),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'last_page' => $notifications->lastPage(),
                'unread_count' => $currentUser->notifications()
                    ->whereNull('read_at')
                    ->count(),
            ],
        ]);
    }

    public function unreadCount(): JsonResponse
    {
        $count = auth('api')
            ->user()
            ->notifications()
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'message' => 'Unread notification count retrieved successfully.',
            'data' => [
                'unread_count' => $count,
            ],
        ]);
    }

    public function markAsRead(Notification $notification): JsonResponse
    {
        $this->ensureOwnership($notification);

        $notification->markAsRead();
        $notification->load('task');

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => [
                'notification' => new NotificationResource($notification),
            ],
        ]);
    }

    public function markAllAsRead(): JsonResponse
    {
        $updatedCount = auth('api')
            ->user()
            ->notifications()
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read.',
            'data' => [
                'updated_count' => $updatedCount,
            ],
        ]);
    }

    public function destroy(Notification $notification): JsonResponse
    {
        $this->ensureOwnership($notification);

        $notification->delete();

        return response()->json([
            'message' => 'Notification removed successfully.',
        ]);
    }

    public function clear(): JsonResponse
    {
        $deletedCount = auth('api')
            ->user()
            ->notifications()
            ->delete();

        return response()->json([
            'message' => 'Notifications cleared successfully.',
            'data' => [
                'deleted_count' => $deletedCount,
            ],
        ]);
    }

    private function ensureOwnership(Notification $notification): void
    {
        $currentUser = auth('api')->user();

        abort_unless(
            $currentUser
                && $notification->user_id === $currentUser->getKey(),
            404,
        );
    }
}
