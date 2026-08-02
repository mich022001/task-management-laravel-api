<?php

namespace App\Http\Controllers\Api\Internal;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max($request->integer('per_page', 15), 1),
            100,
        );

        $users = User::query()
            ->when(
                $request->filled('role'),
                fn ($query) => $query->where(
                    'role',
                    $request->string('role')->toString(),
                ),
            )
            ->when(
                $request->filled('is_active'),
                fn ($query) => $query->where(
                    'is_active',
                    $request->boolean('is_active'),
                ),
            )
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'message' => 'Internal users retrieved successfully.',
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'message' => 'Internal user retrieved successfully.',
            'data' => [
                'user' => new UserResource($user),
            ],
        ]);
    }
}
