<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    /**
     * Admins and managers may access the team-management list.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    /**
     * Admins may view any team.
     * Managers may view teams they created or belong to.
     */
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

    /**
     * Admins and managers may create teams.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    /**
     * Admins may update any team.
     * Managers may update teams they created.
     */
    public function update(User $user, Team $team): bool
    {
        return $user->role === 'admin'
            || (
                $user->role === 'manager'
                && $team->created_by === $user->id
            );
    }

    /**
     * Admins may delete any team.
     * Managers may delete teams they created.
     */
    public function delete(User $user, Team $team): bool
    {
        return $user->role === 'admin'
            || (
                $user->role === 'manager'
                && $team->created_by === $user->id
            );
    }

    /**
     * Admins may manage members of any team.
     * Managers may manage members when they are the owner or team lead.
     */
    public function manageMembers(User $user, Team $team): bool
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

    /**
     * Team restore is not exposed.
     */
    public function restore(User $user, Team $team): bool
    {
        return false;
    }

    /**
     * Permanent deletion is not exposed.
     */
    public function forceDelete(User $user, Team $team): bool
    {
        return false;
    }
}
