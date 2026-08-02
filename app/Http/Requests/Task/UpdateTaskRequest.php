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
                'integer',
                Rule::exists('teams', 'id'),
            ],

            'assigned_to' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('users', 'id')
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

                $teamId = $this->has('team_id')
                    ? $this->integer('team_id')
                    : $task->team_id;

                $team = Team::query()->find($teamId);

                if (! $team) {
                    return;
                }

                if (
                    $currentUser->role === 'manager'
                    && ! $this->managerCanAccessTeam($team, $currentUser->id)
                ) {
                    $validator->errors()->add(
                        'team_id',
                        'You are not authorized to move tasks to this team.',
                    );
                }

                $assigneeId = $this->has('assigned_to')
                    ? $this->input('assigned_to')
                    : $task->assigned_to;

                if (! $assigneeId) {
                    return;
                }

                $belongsToTeam = $team->members()
                    ->where('users.id', $assigneeId)
                    ->exists();

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
            ->exists();
    }
}
