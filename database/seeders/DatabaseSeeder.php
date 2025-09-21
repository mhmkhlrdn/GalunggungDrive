<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class DatabaseSeeder extends Seeder {
    public function run(): void {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'storage_limit' => 10737418240, // 10 GB
            'storage_used' => 0,
        ]);

        User::create([
            'name' => 'Staff User',
            'email' => 'staff@example.com',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'storage_limit' => 5368709120, // 5 GB
            'storage_used' => 0,
        ]);

        User::create([
            'name' => 'Guest User',
            'email' => 'guest@example.com',
            'password' => Hash::make('password'),
            'role' => 'guest',
            'storage_limit' => 1073741824, // 1 GB
            'storage_used' => 0,
        ]);
    }
}
