<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Team\StoreTeamRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TeamController extends Controller
{
    /**
     * Display a paginated list of teams.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Team::class);

        $currentUser = auth('api')->user();

        $query = Team::query()
            ->with('creator')
            ->withCount([
                'members',
                'tasks',
            ]);

        // Managers can only see teams they created or belong to.
        if ($currentUser->role === 'manager') {
            $query->where(function ($builder) use ($currentUser) {
                $builder
                    ->where('created_by', $currentUser->id)
                    ->orWhereHas(
                        'members',
                        fn ($memberQuery) => $memberQuery->where(
                            'users.id',
                            $currentUser->id,
                        ),
                    );
            });
        }

        $query
            ->when(
                $request->filled('search'),
                function ($builder) use ($request) {
                    $search = mb_strtolower(
                        trim($request->string('search')->toString()),
                    );

                    $builder->whereRaw(
                        'LOWER(name) LIKE ?',
                        ["%{$search}%"],
                    );
                },
            )
            ->latest();

        $perPage = min(
            max((int) $request->input('per_page', 15), 1),
            100,
        );

        $teams = $query->paginate($perPage);

        return response()->json([
            'message' => 'Teams retrieved successfully.',
            'data' => TeamResource::collection($teams->items()),
            'meta' => [
                'current_page' => $teams->currentPage(),
                'per_page' => $teams->perPage(),
                'total' => $teams->total(),
                'last_page' => $teams->lastPage(),
            ],
        ]);
    }

    /**
     * Create a team and assign the selected manager as team lead.
     */
    public function store(StoreTeamRequest $request): JsonResponse
    {
        $currentUser = auth('api')->user();
        $validated = $request->validated();

        $manager = User::query()
            ->where('uuid', $validated['manager_id'])
            ->where('role', 'manager')
            ->where('is_active', true)
            ->firstOrFail();

        $team = DB::transaction(function () use (
            $validated,
            $currentUser,
            $manager,
        ) {
            $team = Team::query()->create([
                'name' => $validated['name'],
                'created_by' => $currentUser->id,
            ]);

            $team->members()->attach($manager->id, [
                'member_role' => 'lead',
            ]);

            return $team;
        });

        $team
            ->load([
                'creator',
                'members',
            ])
            ->loadCount([
                'members',
                'tasks',
            ]);

        return response()->json([
            'message' => 'Team created successfully.',
            'data' => [
                'team' => new TeamResource($team),
            ],
        ], 201);
    }

    /**
     * Display a team with its members.
     */
    public function show(Team $team): JsonResponse
    {
        Gate::authorize('view', $team);

        $team
            ->load([
                'creator',
                'members',
            ])
            ->loadCount([
                'members',
                'tasks',
            ]);

        return response()->json([
            'message' => 'Team retrieved successfully.',
            'data' => [
                'team' => new TeamResource($team),
            ],
        ]);
    }
}
