<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $targetUser = $this->route('user');

        return $targetUser
            && auth('api')->user()?->can('update', $targetUser);
    }

    public function rules(): array
    {
        $currentUser = auth('api')->user();
        $targetUser = $this->route('user');

        $allowedRoles = $currentUser?->role === 'admin'
            ? ['admin', 'manager', 'team_member']
            : ['team_member'];

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($targetUser?->id),
            ],
            'role' => [
                'sometimes',
                'required',
                Rule::in($allowedRoles),
            ],
        ];
    }
}
