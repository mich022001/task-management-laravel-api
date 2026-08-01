<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Task Management Laravel API',
        'status' => 'running',
    ]);
});
