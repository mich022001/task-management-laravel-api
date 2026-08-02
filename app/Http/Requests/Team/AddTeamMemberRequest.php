<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddTeamMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        $team = $this->route('team');

        return $team
            && auth('api')->user()?->can('manageMembers', $team);
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')
                    ->where(fn ($query) => $query
                        ->where('is_active', true)
                        ->whereNull('deleted_at')),
            ],
            'member_role' => [
                'sometimes',
                'string',
                Rule::in(['lead', 'member']),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('member_role')) {
            $this->merge([
                'member_role' => 'member',
            ]);
        }
    }
}
