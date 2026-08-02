<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    /**
     * Display a paginated list of users.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', User::class);

        $currentUser = auth('api')->user();

        $query = User::query();

        // Managers may only list Team Members belonging to teams
        // they own or lead.
        if ($currentUser->role === 'manager') {
            $query
                ->where('role', 'team_member')
                ->whereHas('teams', function ($teamQuery) use ($currentUser) {
                    $teamQuery->where(function ($managedTeamQuery) use (
                        $currentUser,
                    ) {
                        $managedTeamQuery
                            ->where(
                                'teams.created_by',
                                $currentUser->id,
                            )
                            ->orWhereExists(function ($membershipQuery) use (
                                $currentUser,
                            ) {
                                $membershipQuery
                                    ->selectRaw('1')
                                    ->from(
                                        'team_members as manager_memberships',
                                    )
                                    ->whereColumn(
                                        'manager_memberships.team_id',
                                        'teams.id',
                                    )
                                    ->where(
                                        'manager_memberships.user_id',
                                        $currentUser->id,
                                    )
                                    ->where(
                                        'manager_memberships.member_role',
                                        'lead',
                                    );
                            });
                    });
                });
        }

        $query
            ->when(
                $request->filled('role'),
                fn ($builder) => $builder->where(
                    'role',
                    $request->string('role')->toString(),
                ),
            )
            ->when(
                $request->filled('status'),
                function ($builder) use ($request) {
                    $status = $request->string('status')->toString();

                    return match ($status) {
                        'active' => $builder->where('is_active', true),
                        'inactive' => $builder->where('is_active', false),
                        default => $builder,
                    };
                },
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
                                'LOWER(name) LIKE ?',
                                ["%{$search}%"],
                            )
                            ->orWhereRaw(
                                'LOWER(email) LIKE ?',
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

        $users = $query->paginate($perPage);

        return response()->json([
            'message' => 'Users retrieved successfully.',
            'data' => UserResource::collection($users->items()),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    /**
     * Create a user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $validated['is_active'] ??= true;

        $user = User::query()->create($validated);

        return response()->json([
            'message' => 'User created successfully.',
            'data' => [
                'user' => new UserResource($user->fresh()),
            ],
        ], 201);
    }

    /**
     * Display a user.
     */
    public function show(User $user): JsonResponse
    {
        Gate::authorize('view', $user);

        return response()->json([
            'message' => 'User retrieved successfully.',
            'data' => [
                'user' => new UserResource($user),
            ],
        ]);
    }

    /**
     * Update a user.
     */
    public function update(
        UpdateUserRequest $request,
        User $user,
    ): JsonResponse {
        $user->update($request->validated());

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => [
                'user' => new UserResource($user->fresh()),
            ],
        ]);
    }
}
