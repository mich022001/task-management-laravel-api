<?php

namespace App\Http\Requests\Task;

use App\Models\Task;
use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->user()?->can('create', Task::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'team_id' => [
                'required',
                'integer',
                Rule::exists('teams', 'id'),
            ],

            'assigned_to' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id')
                    ->where(fn ($query) => $query
                        ->where('is_active', true)
                        ->whereNull('deleted_at')),
            ],

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'priority' => [
                'required',
                Rule::in([
                    'low',
                    'medium',
                    'high',
                ]),
            ],

            'due_date' => [
                'nullable',
                'date',
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $currentUser = auth('api')->user();
                $teamId = $this->integer('team_id');
                $assigneeId = $this->input('assigned_to');

                if (! $currentUser || ! $teamId) {
                    return;
                }

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
                        'You are not authorized to create tasks for this team.',
                    );
                }

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
            ->wherePivot('member_role', 'lead')
            ->exists();
    }
}
