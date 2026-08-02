<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $task = $this->route('task');

        return $task
            && auth('api')->user()?->can('comment', $task);
    }

    public function rules(): array
    {
        return [
            'body' => [
                'required',
                'string',
                'max:2000',
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('body')) {
            $this->merge([
                'body' => trim((string) $this->input('body')),
            ]);
        }
    }
}
