<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->user()?->can('create', \App\Models\User::class) ?? false;
    }

    public function rules(): array
    {
        $user = auth('api')->user();

        $allowedRoles = $user?->role === 'admin'
            ? ['admin', 'manager', 'team_member']
            : ['team_member'];

        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'password' => [
                'required',
                'string',
                'min:8',
            ],
            'role' => [
                'required',
                Rule::in($allowedRoles),
            ],
            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}
