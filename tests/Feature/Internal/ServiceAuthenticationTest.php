<?php

namespace Tests\Feature\Internal;

use Tests\TestCase;

class ServiceAuthenticationTest extends TestCase
{
    private string $serviceKey = 'testing-internal-service-key-1234567890';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'internal.service_key' => $this->serviceKey,
        ]);
    }

    public function test_internal_endpoint_rejects_missing_service_key(): void
    {
        $response = $this->getJson('/api/v1/internal/health');

        $response
            ->assertUnauthorized()
            ->assertJson([
                'message' => 'Invalid or missing service key.',
                'code' => 'INVALID_SERVICE_KEY',
            ]);
    }

    public function test_internal_endpoint_rejects_invalid_service_key(): void
    {
        $response = $this
            ->withHeader('X-Service-Key', 'invalid-key')
            ->getJson('/api/v1/internal/health');

        $response
            ->assertUnauthorized()
            ->assertJson([
                'message' => 'Invalid or missing service key.',
                'code' => 'INVALID_SERVICE_KEY',
            ]);
    }

    public function test_internal_endpoint_accepts_valid_service_key(): void
    {
        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson('/api/v1/internal/health');

        $response
            ->assertOk()
            ->assertJsonPath(
                'message',
                'Internal Laravel API is available.',
            )
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath(
                'data.service',
                'task-management-laravel-api',
            );
    }

    public function test_internal_endpoint_does_not_require_user_jwt(): void
    {
        $response = $this
            ->withHeader('X-Service-Key', $this->serviceKey)
            ->getJson('/api/v1/internal/health');

        $response->assertOk();
    }
}
