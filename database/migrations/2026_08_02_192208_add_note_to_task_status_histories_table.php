<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_status_histories', function (Blueprint $table) {
            $table->text('note')
                ->nullable()
                ->after('new_status');
        });
    }

    public function down(): void
    {
        Schema::table('task_status_histories', function (Blueprint $table) {
            $table->dropColumn('note');
        });
    }
};
