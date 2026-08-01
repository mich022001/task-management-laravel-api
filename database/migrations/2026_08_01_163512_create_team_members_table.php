<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_members', function (Blueprint $table) {
            $table->id();

            $table->foreignId('team_id')
                ->constrained('teams')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('member_role', 20)
                ->default('member');

            $table->timestamps();

            $table->unique(['team_id', 'user_id']);

            $table->index('team_id');
            $table->index('user_id');
            $table->index('member_role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_members');
    }
};
