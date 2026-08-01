<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

class TeamMemberSeeder extends Seeder
{
    public function run(): void
    {
        $manager = User::query()
            ->where('email', 'manager@test.com')
            ->firstOrFail();

        $member = User::query()
            ->where('email', 'member@test.com')
            ->firstOrFail();

        $engineering = Team::query()
            ->where('name', 'Engineering')
            ->firstOrFail();

        $marketing = Team::query()
            ->where('name', 'Marketing')
            ->firstOrFail();

        $sales = Team::query()
            ->where('name', 'Sales')
            ->firstOrFail();

        $engineering->members()->syncWithoutDetaching([
            $manager->id => ['member_role' => 'lead'],
            $member->id => ['member_role' => 'member'],
        ]);

        $marketing->members()->syncWithoutDetaching([
            $manager->id => ['member_role' => 'lead'],
        ]);

        $sales->members()->syncWithoutDetaching([
            $member->id => ['member_role' => 'member'],
        ]);
    }
}
