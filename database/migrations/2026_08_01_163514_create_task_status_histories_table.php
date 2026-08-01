<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_status_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('task_id')
                ->constrained('tasks')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('previous_status', 30)->nullable();
            $table->string('new_status', 30);

            $table->foreignId('changed_by')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->timestamps();

            $table->index('task_id');
            $table->index('changed_by');
            $table->index('new_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_status_histories');
    }
};
