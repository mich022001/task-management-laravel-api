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
                'uuid',
                Rule::exists('users', 'uuid')
                    ->where(function ($query) {
                        $query
                            ->where('is_active', true)
                            ->whereNull('deleted_at');

                        if ($this->input('member_role') === 'lead') {
                            $query->where('role', 'manager');
                        }
                    }),
            ],

            'member_role' => [
                'sometimes',
                'string',
                Rule::in([
                    'lead',
                    'member',
                ]),
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

    public function messages(): array
    {
        return [
            'user_id.exists' => 'The selected user must be active. Only Manager accounts may be assigned as team leads.',
        ];
    }
}
