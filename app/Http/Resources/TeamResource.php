<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeamResource extends JsonResource
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
            'name' => $this->name,

            'creator' => new UserResource(
                $this->whenLoaded('creator'),
            ),

            'members' => TeamMemberResource::collection(
                $this->whenLoaded('members'),
            ),

            'members_count' => $this->whenCounted('members'),
            'tasks_count' => $this->whenCounted('tasks'),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
