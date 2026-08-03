<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class NodeNotificationService
{
    public function taskAssigned(
        Task $task,
        User $recipient,
    ): bool {
        return $this->sendIfEnabled(
            recipient: $recipient,
            payload: [
                'type' => 'task_assigned',
                'task_id' => $task->uuid,
            ],
        );
    }

    public function taskStatusChanged(
        Task $task,
        User $recipient,
        string $previousStatus,
        string $newStatus,
    ): bool {
        return $this->sendIfEnabled(
            recipient: $recipient,
            payload: [
                'type' => 'task_status_changed',
                'task_id' => $task->uuid,
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
            ],
        );
    }

    public function taskCompleted(
        Task $task,
        User $recipient,
    ): bool {
        return $this->sendIfEnabled(
            recipient: $recipient,
            payload: [
                'type' => 'task_completed',
                'task_id' => $task->uuid,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function sendIfEnabled(
        User $recipient,
        array $payload,
    ): bool {
        if (
            ! $recipient->email_notifications_enabled
            || blank($recipient->email)
        ) {
            Log::info('Notification email skipped.', [
                'notification_type' => $payload['type'],
                'task_id' => $payload['task_id'] ?? null,
                'recipient_id' => $recipient->uuid,
                'reason' => blank($recipient->email)
                    ? 'RECIPIENT_EMAIL_MISSING'
                    : 'EMAIL_NOTIFICATIONS_DISABLED',
            ]);

            return false;
        }

        return $this->send(
            payload: $payload,
            recipient: $recipient,
        );
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function send(
        array $payload,
        User $recipient,
    ): bool {
        try {
            $response = Http::acceptJson()
                ->asJson()
                ->withHeaders([
                    'X-Service-Key' => (string) config(
                        'services.node_notifications.service_key',
                    ),
                ])
                ->timeout(
                    (int) config(
                        'services.node_notifications.timeout',
                        5,
                    ),
                )
                ->post(
                    (string) config(
                        'services.node_notifications.url',
                    ),
                    $payload,
                );

            $response->throw();

            Log::info('Notification email queued.', [
                'notification_type' => $payload['type'],
                'task_id' => $payload['task_id'] ?? null,
                'recipient_id' => $recipient->uuid,
                'node_job_id' => $response->json('data.job.id'),
            ]);

            return true;
        } catch (Throwable $exception) {
            Log::warning('Unable to queue notification email.', [
                'notification_type' => $payload['type'],
                'task_id' => $payload['task_id'] ?? null,
                'recipient_id' => $recipient->uuid,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            return false;
        }
    }
}
