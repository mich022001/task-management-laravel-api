<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Admins and managers may access the user-management list.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    /**
     * Admins may view any user.
     * Managers may view only Team Members.
     * Users may view their own profile.
     */
    public function view(User $user, User $model): bool
    {
        if ($user->id === $model->id) {
            return true;
        }

        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'manager'
            && $model->role === 'team_member';
    }

    /**
     * Admins and managers may create users.
     * The request validation will restrict managers to Team Members.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    /**
     * Admins may update any user.
     * Managers may update Team Members only.
     */
    public function update(User $user, User $model): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'manager'
            && $model->role === 'team_member';
    }

    /**
     * User deletion is not supported.
     * Accounts are deactivated instead.
     */
    public function delete(User $user, User $model): bool
    {
        return false;
    }

    /**
     * Admins may update active/inactive status.
     * Managers may update Team Members only.
     */
    public function updateStatus(User $user, User $model): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'manager'
            && $model->role === 'team_member';
    }

    /**
     * Restoring deleted users is not exposed by the API.
     */
    public function restore(User $user, User $model): bool
    {
        return false;
    }

    /**
     * Permanent deletion is never allowed.
     */
    public function forceDelete(User $user, User $model): bool
    {
        return false;
    }
}
