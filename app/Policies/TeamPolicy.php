<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    public function view(User $user, Team $team): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role !== 'manager') {
            return false;
        }

        return $team->created_by === $user->id
            || $team->members()
                ->where('users.id', $user->id)
                ->exists();
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    /**
     * Admins may update any team.
     * Managers may update only teams where they are assigned as lead.
     */
    public function update(User $user, Team $team): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role !== 'manager') {
            return false;
        }

        return $team->members()
            ->where('users.id', $user->id)
            ->wherePivot('member_role', 'lead')
            ->exists();
    }

    public function delete(User $user, Team $team): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Admins may manage any membership.
     * Managers may manage membership only for teams they handle as lead.
     */
    public function manageMembers(User $user, Team $team): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role !== 'manager') {
            return false;
        }

        return $team->members()
            ->where('users.id', $user->id)
            ->wherePivot('member_role', 'lead')
            ->exists();
    }

    /**
     * Determine whether the user may list tasks belonging to the team.
     */
    public function viewTasks(User $user, Team $team): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'manager') {
            return $team->created_by === $user->id
                || $team->members()
                    ->where('users.id', $user->id)
                    ->exists();
        }

        if ($user->role === 'team_member') {
            return $team->members()
                ->where('users.id', $user->id)
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user may create tasks for the team.
     */
    public function createTask(User $user, Team $team): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role !== 'manager') {
            return false;
        }

        if ($team->created_by === $user->id) {
            return true;
        }

        return $team->members()
            ->where('users.id', $user->id)
            ->wherePivot('member_role', 'lead')
            ->exists();
    }

    public function restore(User $user, Team $team): bool
    {
        return false;
    }

    public function forceDelete(User $user, Team $team): bool
    {
        return false;
    }
}
