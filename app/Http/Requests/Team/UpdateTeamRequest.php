<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        $team = $this->route('team');

        return $team
            && auth('api')->user()?->can('update', $team);
    }

    public function rules(): array
    {
        $team = $this->route('team');

        return [
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('teams', 'name')->ignore($team?->id),
            ],

            'manager_id' => [
                'required',
                'uuid',
                Rule::exists('users', 'uuid')
                    ->where(
                        fn ($query) => $query
                            ->where('role', 'manager')
                            ->where('is_active', true)
                            ->whereNull('deleted_at'),
                    ),
            ],
        ];
    }
}
