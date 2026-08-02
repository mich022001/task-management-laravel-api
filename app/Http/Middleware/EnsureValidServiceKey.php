<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureValidServiceKey
{
    /**
     * Validate service-to-service authentication.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(
        Request $request,
        Closure $next,
    ): Response|JsonResponse {
        $configuredKey = config('internal.service_key');
        $providedKey = $request->header('X-Service-Key');

        if (
            ! is_string($configuredKey)
            || $configuredKey === ''
            || ! is_string($providedKey)
            || $providedKey === ''
            || ! hash_equals($configuredKey, $providedKey)
        ) {
            return response()->json([
                'message' => 'Invalid or missing service key.',
                'code' => 'INVALID_SERVICE_KEY',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}
