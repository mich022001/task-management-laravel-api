<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($this->managesTaskTeam($user, $task)) {
            return true;
        }

        return $task->assigned_to === $user->id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    public function update(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $this->managesTaskTeam($user, $task);
    }

    public function changeStatus(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($this->managesTaskTeam($user, $task)) {
            return true;
        }

        return $task->assigned_to === $user->id;
    }

    public function comment(User $user, Task $task): bool
    {
        return $this->view($user, $task);
    }

    public function viewActivity(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $this->managesTaskTeam($user, $task);
    }

    public function delete(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $this->managesTaskTeam($user, $task)
            && $task->created_by === $user->id;
    }

    public function restore(User $user, Task $task): bool
    {
        return $user->role === 'admin';
    }

    public function forceDelete(User $user, Task $task): bool
    {
        return false;
    }

    private function managesTaskTeam(User $user, Task $task): bool
    {
        if ($user->role !== 'manager') {
            return false;
        }

        $task->loadMissing('team');

        if (! $task->team) {
            return false;
        }

        if ($task->team->created_by === $user->id) {
            return true;
        }

        return $task->team
            ->members()
            ->where('users.id', $user->id)
            ->wherePivot('member_role', 'lead')
            ->exists();
    }
}
