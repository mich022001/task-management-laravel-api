<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->configurePasswordResetUrl();
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('login', function (Request $request): Limit {
            $email = Str::lower(
                (string) $request->input('email'),
            );

            return Limit::perMinute(5)
                ->by($email.'|'.$request->ip())
                ->response(function () {
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again later.',
                    ], 429);
                });
        });
    }

    private function configurePasswordResetUrl(): void
    {
        ResetPassword::createUrlUsing(
            function (object $notifiable, string $token): string {
                $frontendUrl = rtrim(
                    (string) config('app.frontend_url'),
                    '/',
                );

                return sprintf(
                    '%s/reset-password?token=%s&email=%s',
                    $frontendUrl,
                    urlencode($token),
                    urlencode(
                        $notifiable->getEmailForPasswordReset(),
                    ),
                );
            },
        );
    }
}
