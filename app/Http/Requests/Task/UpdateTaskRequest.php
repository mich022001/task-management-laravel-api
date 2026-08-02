<?php

namespace App\Http\Requests\Task;

use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $task = $this->route('task');

        return $task
            && auth('api')->user()?->can('update', $task);
    }

    public function rules(): array
    {
        return [
            'team_id' => [
                'sometimes',
                'required',
                'uuid',
                Rule::exists('teams', 'uuid'),
            ],

            'assigned_to' => [
                'sometimes',
                'nullable',
                'uuid',
                Rule::exists('users', 'uuid')
                    ->where(fn ($query) => $query
                        ->where('is_active', true)
                        ->whereNull('deleted_at')),
            ],

            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'priority' => [
                'sometimes',
                'required',
                Rule::in([
                    'low',
                    'medium',
                    'high',
                ]),
            ],

            'due_date' => [
                'sometimes',
                'nullable',
                'date',
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $task = $this->route('task');
                $currentUser = auth('api')->user();

                if (! $task || ! $currentUser) {
                    return;
                }

                $team = $this->has('team_id')
                    ? Team::query()
                        ->where('uuid', $this->input('team_id'))
                        ->first()
                    : $task->team;

                if (! $team) {
                    return;
                }

                if (
                    $currentUser->role === 'manager'
                    && ! $this->managerCanAccessTeam(
                        $team,
                        $currentUser->id,
                    )
                ) {
                    $validator->errors()->add(
                        'team_id',
                        'You are not authorized to move tasks to this team.',
                    );
                }

                if ($this->has('assigned_to')) {
                    $assigneeUuid = $this->input('assigned_to');

                    if (! $assigneeUuid) {
                        return;
                    }

                    $belongsToTeam = $team->members()
                        ->where('users.uuid', $assigneeUuid)
                        ->exists();
                } elseif ($task->assigned_to) {
                    $belongsToTeam = $team->members()
                        ->where('users.id', $task->assigned_to)
                        ->exists();
                } else {
                    return;
                }

                if (! $belongsToTeam) {
                    $validator->errors()->add(
                        'assigned_to',
                        'The assigned user must be a member of the selected team.',
                    );
                }
            },
        ];
    }

    private function managerCanAccessTeam(Team $team, int $userId): bool
    {
        if ($team->created_by === $userId) {
            return true;
        }

        return $team->members()
            ->where('users.id', $userId)
            ->wherePivot('member_role', 'lead')
            ->exists();
    }
}
