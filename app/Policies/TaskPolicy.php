<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Determine whether the user may list tasks.
     */
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    /**
     * Determine whether the user may view a task.
     */
    public function view(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'manager') {
            return $this->belongsToTaskTeam($user, $task);
        }

        return $task->assigned_to === $user->id;
    }

    /**
     * Determine whether the user may create tasks.
     */
    public function create(User $user): bool
    {
        return in_array($user->role, [
            'admin',
            'manager',
        ], true);
    }

    /**
     * Determine whether the user may update a task.
     */
    public function update(User $user, Task $task): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role === 'manager') {
            return $this->belongsToTaskTeam($user, $task);
        }

        return $task->assigned_to === $user->id;
    }

    /**
     * Determine whether the user may delete a task.
     */
    public function delete(User $user, Task $task): bool
    {
        return $user->role === 'admin'
            || $task->created_by === $user->id;
    }

    /**
     * Determine whether the user may restore a task.
     */
    public function restore(User $user, Task $task): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user may permanently delete a task.
     */
    public function forceDelete(User $user, Task $task): bool
    {
        return false;
    }

    /**
     * Determine whether the manager belongs to the task's team.
     */
    private function belongsToTaskTeam(User $user, Task $task): bool
    {
        if ($task->team->created_by === $user->id) {
            return true;
        }

        return $task->team
            ->members()
            ->where('users.id', $user->id)
            ->exists();
    }
}
