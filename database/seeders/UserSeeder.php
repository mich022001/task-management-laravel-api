<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'System Admin',
                'password' => 'password123',
                'role' => 'admin',
                'is_active' => true,
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'manager@test.com'],
            [
                'name' => 'Team Manager',
                'password' => 'password123',
                'role' => 'manager',
                'is_active' => true,
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'member@test.com'],
            [
                'name' => 'Team Member',
                'password' => 'password123',
                'role' => 'team_member',
                'is_active' => true,
            ],
        );

        User::factory()
            ->count(6)
            ->teamMember()
            ->create();
    }
}
