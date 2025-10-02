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
        
        try {
            if (class_exists(StorageLocation::class)) {
                $dynamicDisks = [];
                $locations = StorageLocation::query()->where('is_active', true)->get();
                foreach ($locations as $loc) {
                    if ($loc->root) {
                        $dynamicDisks[$loc->diskKey()] = [
                            'driver' => 'local',
                            'root' => $loc->root,
                            'visibility' => $loc->visibility ?? 'private',
                            'throw' => false,
                            'report' => false,
                        ];
                    }
                }
                $existing = Config::get('filesystems.disks', []);
                Config::set('filesystems.disks', array_merge($existing, $dynamicDisks));
            }
        } catch (\Throwable $e) {
            
        }
    }
}
