<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateNotificationPreferenceRequest;
use Illuminate\Http\JsonResponse;

class NotificationPreferenceController extends Controller
{
    public function show(): JsonResponse
    {
        $user = auth('api')->user();

        return response()->json([
            'message' => 'Notification preferences retrieved successfully.',
            'data' => [
                'email_notifications_enabled' => (bool) $user
                    ->email_notifications_enabled,
            ],
        ]);
    }

    public function update(
        UpdateNotificationPreferenceRequest $request,
    ): JsonResponse {
        $user = auth('api')->user();

        $user->update([
            'email_notifications_enabled' => $request->boolean(
                'email_notifications_enabled',
            ),
        ]);

        return response()->json([
            'message' => 'Notification preferences updated successfully.',
            'data' => [
                'email_notifications_enabled' => (bool) $user
                    ->fresh()
                    ->email_notifications_enabled,
            ],
        ]);
    }
}
