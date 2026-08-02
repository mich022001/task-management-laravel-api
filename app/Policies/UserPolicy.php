<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    public function view(User $user, User $model): bool
    {
        if ($user->id === $model->id) {
            return true;
        }

        if ($user->role === 'admin') {
            return true;
        }

        return $this->managerCanManageMember($user, $model);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    public function update(User $user, User $model): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $this->managerCanManageMember($user, $model);
    }

    public function delete(User $user, User $model): bool
    {
        return false;
    }

    public function updateStatus(User $user, User $model): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $this->managerCanManageMember($user, $model);
    }

    public function restore(User $user, User $model): bool
    {
        return false;
    }

    public function forceDelete(User $user, User $model): bool
    {
        return false;
    }

    private function managerCanManageMember(
        User $manager,
        User $member,
    ): bool {
        if (
            $manager->role !== 'manager'
            || $member->role !== 'team_member'
        ) {
            return false;
        }

        return $member
            ->teams()
            ->where(function ($query) use ($manager) {
                $query
                    ->where('teams.created_by', $manager->id)
                    ->orWhereExists(function ($membershipQuery) use (
                        $manager,
                    ) {
                        $membershipQuery
                            ->selectRaw('1')
                            ->from('team_members as manager_memberships')
                            ->whereColumn(
                                'manager_memberships.team_id',
                                'teams.id',
                            )
                            ->where(
                                'manager_memberships.user_id',
                                $manager->id,
                            )
                            ->where(
                                'manager_memberships.member_role',
                                'lead',
                            );
                    });
            })
            ->exists();
    }
}
