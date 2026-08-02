<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskActivityLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'action' => $this->action,
            'description' => $this->description,
            'changes' => $this->changes,

            'actor' => new UserResource(
                $this->whenLoaded('actor'),
            ),

            'created_at' => $this->created_at,
        ];
    }
}
