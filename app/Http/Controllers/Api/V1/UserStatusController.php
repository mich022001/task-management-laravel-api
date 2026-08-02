<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateUserStatusRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserStatusController extends Controller
{
    public function __invoke(
        UpdateUserStatusRequest $request,
        User $user,
    ): JsonResponse {
        $user->update([
            'is_active' => $request->boolean('is_active'),
        ]);

        return response()->json([
            'message' => 'User status updated successfully.',
            'data' => [
                'user' => new UserResource($user->fresh()),
            ],
        ]);
    }
}
