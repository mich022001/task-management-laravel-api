<?php

namespace App\Models;

use Database\Factories\TaskActivityLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskActivityLog extends Model
{
    /** @use HasFactory<TaskActivityLogFactory> */
    use HasFactory;

    protected $fillable = [
        'task_id',
        'actor_id',
        'action',
        'description',
        'changes',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
