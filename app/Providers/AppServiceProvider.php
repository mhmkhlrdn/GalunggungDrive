<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Config;
use App\Models\StorageLocation;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Dynamically register active storage locations as filesystem disks
        try {
            if (class_exists(StorageLocation::class)) {
                $dynamicDisks = [];
                $locations = StorageLocation::query()->where('is_active', true)->get();
                foreach ($locations as $loc) {
                    if ($loc->driver === 'local' && $loc->root) {
                        $dynamicDisks[$loc->key] = [
                            'driver' => 'local',
                            'root' => $loc->root,
                            'visibility' => $loc->visibility ?? 'private',
                            'serve' => (bool) $loc->serve,
                            'throw' => false,
                            'report' => false,
                            'url' => $loc->url,
                        ];
                    }
                    // You can extend to support S3 here using loc-specific credentials if needed
                }
                $existing = Config::get('filesystems.disks', []);
                Config::set('filesystems.disks', array_merge($existing, $dynamicDisks));
            }
        } catch (\Throwable $e) {
            // fail safe: don't break boot if DB not ready during migrations
        }
    }
}
