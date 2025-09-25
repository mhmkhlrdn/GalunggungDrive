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
            ['key' => 'private'],
            [
                'name' => 'Private Storage',
                'driver' => 'local',
                'root' => storage_path('app/private'),
                'visibility' => 'private',
                'serve' => true,
                'is_active' => true,
            ]
        );

        // Default public storage (app/public)
        StorageLocation::updateOrCreate(
            ['key' => 'public'],
            [
                'name' => 'Public Storage',
                'driver' => 'local',
                'root' => storage_path('app/public'),
                'visibility' => 'public',
                'serve' => true,
                'is_active' => true,
                'url' => config('app.url') . '/storage',
            ]
        );

        // Example external drive placeholder (inactive by default)
        StorageLocation::updateOrCreate(
            ['key' => 'external_drive'],
            [
                'name' => 'External Drive (configure path and activate)',
                'driver' => 'local',
                'root' => null, // e.g., 'D:\\cloud-data' on Windows or '/mnt/cloud-data' on Linux
                'visibility' => 'private',
                'serve' => true,
                'is_active' => false,
            ]
        );
    }
}


