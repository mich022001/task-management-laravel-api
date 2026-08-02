<?php

namespace App\Http\Resources;

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

            'status_histories' => TaskStatusHistoryResource::collection(
                $this->whenLoaded('statusHistories'),
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
