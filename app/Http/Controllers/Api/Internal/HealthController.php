<?php

namespace App\Http\Controllers\Api\Internal;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'message' => 'Internal Laravel API is available.',
            'data' => [
                'status' => 'ok',
                'service' => 'task-management-laravel-api',
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }
}
