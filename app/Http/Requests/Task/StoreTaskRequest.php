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
        $user = auth('api')->user();

        if (! $user) {
            return false;
        }

        $team = $this->route('team');

        if ($team instanceof Team) {
            return $user->can('createTask', $team);
        }

        return $user->can('create', Task::class);
    }

    protected function prepareForValidation(): void
    {
        $team = $this->route('team');

        if ($team instanceof Team) {
            $this->merge([
                'team_id' => $team->uuid,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'team_id' => [
                'required',
                'uuid',
                Rule::exists('teams', 'uuid'),
            ],

            'assigned_to' => [
                'nullable',
                'uuid',
                Rule::exists('users', 'uuid')
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
                $teamUuid = $this->string('team_id')->toString();
                $assigneeUuid = $this->input('assigned_to');

                if (! $currentUser || $teamUuid === '') {
                    return;
                }

                $team = Team::query()
                    ->where('uuid', $teamUuid)
                    ->first();

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
                        'You are not authorized to create tasks for this team.',
                    );
                }

                if (! $assigneeUuid) {
                    return;
                }

                $belongsToTeam = $team->members()
                    ->where('users.uuid', $assigneeUuid)
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
