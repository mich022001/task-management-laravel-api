<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PasswordResetController;
use App\Http\Controllers\Api\V1\TaskActivityController;
use App\Http\Controllers\Api\V1\TaskCommentController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\TaskStatusController;
use App\Http\Controllers\Api\V1\TeamController;
use App\Http\Controllers\Api\V1\TeamMemberController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\UserStatusController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json([
        'message' => 'API v1 is working.',
    ]);
});

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:login');

    Route::post(
        '/forgot-password',
        [PasswordResetController::class, 'sendResetLink'],
    )->middleware('throttle:5,1');

    Route::post(
        '/reset-password',
        [PasswordResetController::class, 'reset'],
    )->middleware('throttle:5,1');

    Route::middleware([
        'auth:api',
        'active',
    ])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
});

Route::middleware([
    'auth:api',
    'active',
])->group(function () {
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::patch('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    Route::patch(
        '/tasks/{task}/status',
        TaskStatusController::class,
    );

    Route::get(
        '/tasks/{task}/comments',
        [TaskCommentController::class, 'index'],
    );

    Route::post(
        '/tasks/{task}/comments',
        [TaskCommentController::class, 'store'],
    );

    Route::get(
        '/tasks/{task}/activity',
        TaskActivityController::class,
    );

    Route::get(
        '/notifications',
        [NotificationController::class, 'index'],
    );

    Route::get(
        '/notifications/unread-count',
        [NotificationController::class, 'unreadCount'],
    );

    Route::patch(
        '/notifications/read-all',
        [NotificationController::class, 'markAllAsRead'],
    );

    Route::delete(
        '/notifications',
        [NotificationController::class, 'clear'],
    );

    Route::patch(
        '/notifications/{notification}/read',
        [NotificationController::class, 'markAsRead'],
    );

    Route::delete(
        '/notifications/{notification}',
        [NotificationController::class, 'destroy'],
    );

    Route::middleware('role:admin,manager')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::patch('/users/{user}', [UserController::class, 'update']);

        Route::patch(
            '/users/{user}/status',
            UserStatusController::class,
        );

        Route::get('/teams', [TeamController::class, 'index']);
        Route::post('/teams', [TeamController::class, 'store']);
        Route::get('/teams/{team}', [TeamController::class, 'show']);
        Route::patch('/teams/{team}', [TeamController::class, 'update']);

        Route::post(
            '/teams/{team}/members',
            [TeamMemberController::class, 'store'],
        );

        Route::delete(
            '/teams/{team}/members/{user}',
            [TeamMemberController::class, 'destroy'],
        );
    });
});

/*
|--------------------------------------------------------------------------
| Internal service routes
|--------------------------------------------------------------------------
|
| These endpoints use service-to-service authentication through the
| X-Service-Key header. They do not require a user JWT.
|
*/

Route::prefix('internal')
    ->group(base_path('routes/api/internal.php'));
