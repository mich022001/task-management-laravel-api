<?php

namespace App\Http\Controllers\Api\Internal;

use App\Http\Controllers\Controller;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max($request->integer('per_page', 15), 1),
            100,
        );

        $userUuid = $request->string('user_id')->toString();

        $teams = Team::query()
            ->when(
                $userUuid !== '',
                fn ($query) => $query->where(
                    fn ($teamQuery) => $teamQuery
                        ->whereHas(
                            'creator',
                            fn ($creatorQuery) => $creatorQuery->where(
                                'uuid',
                                $userUuid,
                            ),
                        )
                        ->orWhereHas(
                            'members',
                            fn ($memberQuery) => $memberQuery->where(
                                'users.uuid',
                                $userUuid,
                            ),
                        ),
                ),
            )
            ->with('creator')
            ->withCount([
                'members',
                'tasks',
            ])
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'message' => 'Internal teams retrieved successfully.',
            'data' => TeamResource::collection($teams->items()),
            'meta' => [
                'current_page' => $teams->currentPage(),
                'per_page' => $teams->perPage(),
                'total' => $teams->total(),
                'last_page' => $teams->lastPage(),
            ],
        ]);
    }

    public function show(Team $team): JsonResponse
    {
        $team->load([
            'creator',
            'members',
        ])->loadCount([
            'members',
            'tasks',
        ]);

        return response()->json([
            'message' => 'Internal team retrieved successfully.',
            'data' => [
                'team' => new TeamResource($team),
            ],
        ]);
    }
}
