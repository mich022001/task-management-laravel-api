<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->uuid('uuid')
                ->nullable()
                ->unique()
                ->after('id');
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->uuid('uuid')
                ->nullable()
                ->unique()
                ->after('id');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->uuid('uuid')
                ->nullable()
                ->unique()
                ->after('id');
        });

        $this->backfillUuids('users');
        $this->backfillUuids('teams');
        $this->backfillUuids('tasks');

        Schema::table('users', function (Blueprint $table) {
            $table->uuid('uuid')
                ->nullable(false)
                ->change();
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->uuid('uuid')
                ->nullable(false)
                ->change();
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->uuid('uuid')
                ->nullable(false)
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });
    }

    private function backfillUuids(string $table): void
    {
        DB::table($table)
            ->select('id')
            ->whereNull('uuid')
            ->orderBy('id')
            ->chunkById(100, function ($records) use ($table) {
                foreach ($records as $record) {
                    DB::table($table)
                        ->where('id', $record->id)
                        ->update([
                            'uuid' => (string) Str::uuid(),
                        ]);
                }
            });
    }
};
