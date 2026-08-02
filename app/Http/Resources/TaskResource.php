<?php

namespace App\Http\Resources;

use App\Services\TaskTransitionService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'team_id' => $this->team_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,

            'allowed_transitions' => app(
                TaskTransitionService::class,
            )->allowedTransitions($this->resource),

            'priority' => $this->priority,
            'assigned_to' => $this->assigned_to,
            'created_by' => $this->created_by,
            'due_date' => $this->due_date,
            'completed_at' => $this->completed_at,

            'team' => new TeamResource(
                $this->whenLoaded('team'),
            ),

            'assignee' => new UserResource(
                $this->whenLoaded('assignee'),
            ),

            'creator' => new UserResource(
                $this->whenLoaded('creator'),
            ),

            'comments' => TaskCommentResource::collection(
                $this->whenLoaded('comments'),
            ),

            'status_histories' => TaskStatusHistoryResource::collection(
                $this->whenLoaded('statusHistories'),
            ),

            'activity_logs' => TaskActivityLogResource::collection(
                $this->whenLoaded('activityLogs'),
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
