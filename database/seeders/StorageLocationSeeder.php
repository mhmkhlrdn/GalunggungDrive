<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StorageLocation;

class StorageLocationSeeder extends Seeder
{
    public function run(): void
    {
        // Default private storage (app/private)
        StorageLocation::updateOrCreate(
            [
                'name' => 'Private Storage',
                'root' => storage_path('app/private'),
                'can_serve' => true,
                'is_active' => true,
            ]
        );

        // Default public storage (app/public)
        StorageLocation::updateOrCreate(
            [
                'name' => 'Public Storage',
                'root' => storage_path('app/public'),
                'can_serve' => true,
                'is_active' => true,
            ]
        );

        // Example external drive placeholder (inactive by default)
        StorageLocation::updateOrCreate(
            [
                'name' => 'External Drive (configure path and activate)',
                'root' => null,
                'can_serve' => true,
                'is_active' => false,
            ]
        );
    }
}


