<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $task = $this->route('task');

        return $task
            && auth('api')->user()?->can('changeStatus', $task);
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    'pending',
                    'in_progress',
                    'completed',
                    'cancelled',
                ]),
            ],

            'note' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('note')) {
            $note = trim((string) $this->input('note'));

            $this->merge([
                'note' => $note !== '' ? $note : null,
            ]);
        }
    }
}
