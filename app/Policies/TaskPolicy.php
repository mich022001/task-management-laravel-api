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

        if ($user->role === 'manager') {
            return $this->belongsToTaskTeam($user, $task);
        }

        return $user->role === 'team_member'
            && $task->assigned_to === $user->id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    /**
     * Update task fields such as title, assignee, priority, team, and due date.
     */
    public function update(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'manager'
            && $this->belongsToTaskTeam($user, $task);
    }

    /**
     * Update task status through the dedicated transition endpoint.
     */
    public function changeStatus(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'manager') {
            return $this->belongsToTaskTeam($user, $task);
        }

        return $user->role === 'team_member'
            && $task->assigned_to === $user->id;
    }

    public function delete(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'manager'
            && $task->created_by === $user->id
            && $this->belongsToTaskTeam($user, $task);
    }

    public function restore(User $user, Task $task): bool
    {
        return $user->role === 'admin';
    }

    public function forceDelete(User $user, Task $task): bool
    {
        return false;
    }

    private function belongsToTaskTeam(User $user, Task $task): bool
    {
        $task->loadMissing('team');

        if ($task->team->created_by === $user->id) {
            return true;
        }

        return $task->team
            ->members()
            ->where('users.id', $user->id)
            ->exists();
    }
}
