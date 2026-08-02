<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * @var array<int, string>
     */
    private array $tables = [
        'task_comments',
        'task_status_histories',
        'task_activity_logs',
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->uuid('uuid')
                    ->nullable()
                    ->unique()
                    ->after('id');
            });

            $this->backfillUuids($tableName);

            Schema::table($tableName, function (Blueprint $table) {
                $table->uuid('uuid')
                    ->nullable(false)
                    ->change();
            });
        }
    }

    public function down(): void
    {
        foreach (array_reverse($this->tables) as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropUnique(['uuid']);
                $table->dropColumn('uuid');
            });
        }
    }

    private function backfillUuids(string $tableName): void
    {
        DB::table($tableName)
            ->select('id')
            ->whereNull('uuid')
            ->orderBy('id')
            ->chunkById(100, function ($records) use ($tableName) {
                foreach ($records as $record) {
                    DB::table($tableName)
                        ->where('id', $record->id)
                        ->update([
                            'uuid' => (string) Str::uuid(),
                        ]);
                }
            });
    }
};
