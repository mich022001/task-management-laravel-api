<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInternalNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                'uuid',
                Rule::exists('users', 'uuid')
                    ->whereNull('deleted_at'),
            ],

            'task_id' => [
                'nullable',
                'uuid',
                Rule::exists('tasks', 'uuid')
                    ->whereNull('deleted_at'),
            ],

            'type' => [
                'required',
                'string',
                Rule::in([
                    'task_assigned',
                    'task_cancelled',
                    'task_completed',
                    'deadline_upcoming',
                    'deadline_overdue',
                    'custom',
                ]),
            ],

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'message' => [
                'required',
                'string',
                'max:2000',
            ],

            'data' => [
                'sometimes',
                'array',
            ],

            'deduplication_key' => [
                'nullable',
                'string',
                'max:255',
            ],
        ];
    }
}
