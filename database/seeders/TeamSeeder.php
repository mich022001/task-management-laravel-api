<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class TeamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::query()
            ->where('email', 'admin@test.com')
            ->firstOrFail();

        $manager = User::query()
            ->where('email', 'manager@test.com')
            ->firstOrFail();

        Team::query()->updateOrCreate(
            ['name' => 'Engineering'],
            ['created_by' => $manager->id],
        );

        Team::query()->updateOrCreate(
            ['name' => 'Marketing'],
            ['created_by' => $manager->id],
        );

        Team::query()->updateOrCreate(
            ['name' => 'Sales'],
            ['created_by' => $admin->id],
        );
    }
}
