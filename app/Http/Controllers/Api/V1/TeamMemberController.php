<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Team\AddTeamMemberRequest;
use App\Http\Resources\TeamResource;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TeamMemberController extends Controller
{
    /**
     * Add a user to a team or update their membership role.
     */
    public function store(
        AddTeamMemberRequest $request,
        Team $team,
    ): JsonResponse {
        $validated = $request->validated();

        DB::transaction(function () use ($team, $validated) {
            $team->members()->syncWithoutDetaching([
                $validated['user_id'] => [
                    'member_role' => $validated['member_role'],
                ],
            ]);
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
            'message' => 'Team member added successfully.',
            'data' => [
                'team' => new TeamResource($team),
            ],
        ]);
    }

    /**
     * Remove a user from a team.
     */
    public function destroy(
        Team $team,
        User $user,
    ): JsonResponse {
        Gate::authorize('manageMembers', $team);

        if ($team->created_by === $user->id) {
            return response()->json([
                'message' => 'The team creator cannot be removed.',
            ], 422);
        }

        $membershipExists = $team->members()
            ->where('users.id', $user->id)
            ->exists();

        if (! $membershipExists) {
            return response()->json([
                'message' => 'The user is not a member of this team.',
            ], 404);
        }

        DB::transaction(function () use ($team, $user) {
            $team->members()->detach($user->id);
        });

        return response()->json([
            'message' => 'Team member removed successfully.',
        ]);
    }
}
