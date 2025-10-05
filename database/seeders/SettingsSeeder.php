<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $defaultSettings = [
            [
                'key' => 'site_name',
                'value' => config('app.name', 'Laravel'),
                'type' => 'string',
                'description' => 'Nama situs web',
            ],
            [
                'key' => 'maintenance_mode',
                'value' => false,
                'type' => 'boolean',
                'description' => 'Mode maintenance situs',
            ],
            [
                'key' => 'logo_filename',
                'value' => null,
                'type' => 'string',
                'description' => 'Nama file logo situs',
            ],
            [
                'key' => 'favicon_filename',
                'value' => null,
                'type' => 'string',
                'description' => 'Nama file favicon situs',
            ],
        ];

        foreach ($defaultSettings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
