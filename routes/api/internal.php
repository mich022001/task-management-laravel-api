<?php

use App\Http\Controllers\Api\Internal\HealthController;
use App\Http\Controllers\Api\Internal\NotificationController;
use App\Http\Controllers\Api\Internal\TaskController;
use App\Http\Controllers\Api\Internal\TeamController;
use App\Http\Controllers\Api\Internal\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('service.key')->group(function () {
    Route::get('/health', HealthController::class);

    Route::post(
        '/notifications',
        [NotificationController::class, 'store'],
    );

    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);

    Route::get('/teams', [TeamController::class, 'index']);
    Route::get('/teams/{team}', [TeamController::class, 'show']);

    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
});
