<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\File;
use App\Models\Folder;

class CacheService
{
    const CACHE_TTL = 300;
    const LONG_CACHE_TTL = 600;
    const SHORT_CACHE_TTL = 60;

    /**
     * Get cached cloud data for user
     */
    public static function getCloudData(User $user): ?array
    {
        $cacheKey = self::getCloudCacheKey($user);
        return Cache::get($cacheKey);
    }

    /**
     * Set cached cloud data for user
     */
    public static function setCloudData(User $user, array $data): void
    {
        $cacheKey = self::getCloudCacheKey($user);
        Cache::put($cacheKey, $data, self::CACHE_TTL);
    }

    /**
     * Get cached folder data
     */
    public static function getFolderData(int $folderId, int $userId): ?array
    {
        $version = Cache::get("folders_version_{$userId}", 0);
        $cacheKey = "folder_show_{$folderId}_{$userId}_v{$version}";
        return Cache::get($cacheKey);
    }

    /**
     * Set cached folder data
     */
    public static function setFolderData(int $folderId, int $userId, array $data): void
    {
        $version = Cache::get("folders_version_{$userId}", 0);
        $cacheKey = "folder_show_{$folderId}_{$userId}_v{$version}";
        Cache::put($cacheKey, $data, self::CACHE_TTL);
    }

    /**
     * Get cached file statistics
     */
    public static function getFileStats(array $folderIds): array
    {
        $cacheKey = 'file_stats_' . md5(implode(',', $folderIds));

        return Cache::remember($cacheKey, self::SHORT_CACHE_TTL, function () use ($folderIds) {
            return DB::table('files')
                ->select('folder_id',
                    DB::raw('COUNT(*) as files_count'),
                    DB::raw('SUM(size) as total_size')
                )
                ->whereIn('folder_id', $folderIds)
                ->whereHas('storageLocation', function ($q) {
                    $q->where('is_active', true);
                })
                ->whereNull('deleted_at')
                ->groupBy('folder_id')
                ->get()
                ->keyBy('folder_id')
                ->toArray();
        });
    }

    /**
     * Get cached starred files for user
     */
    public static function getStarredFiles(int $userId, array $fileIds): array
    {
        if (empty($fileIds)) {
            return [];
        }

        $cacheKey = 'starred_files_' . $userId . '_' . md5(implode(',', $fileIds));

        return Cache::remember($cacheKey, self::LONG_CACHE_TTL, function () use ($userId, $fileIds) {
            return DB::table('user_starred')
                ->where('user_id', $userId)
                ->whereIn('file_id', $fileIds)
                ->pluck('file_id')
                ->toArray();
        });
    }

    /**
     * Get cached users for sharing
     */
    public static function getUsersForSharing(int $excludeUserId): array
    {
        $cacheKey = "users_for_sharing_{$excludeUserId}";

        return Cache::remember($cacheKey, self::LONG_CACHE_TTL, function () use ($excludeUserId) {
            return User::where('id', '!=', $excludeUserId)
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get()
                ->toArray();
        });
    }

    /**
     * Clear all caches related to a user
     */
    public static function clearUserCaches(int $userId): void
    {
        $patterns = [
            "cloud_data_{$userId}_*",
            "folder_show_*_{$userId}",
            "folders_index_{$userId}_*",
            "starred_files_{$userId}_*",
            "users_for_sharing_{$userId}",
        ];

        foreach ($patterns as $pattern) {
            Cache::forget($pattern);
        }
    }

    /**
     * Clear folder-related caches
     */
    public static function clearFolderCaches(int $userId, ?int $parentId = null): void
    {
        $patterns = [
            "folders_index_{$userId}_*",
            "folder_show_*_{$userId}",
        ];

        if ($parentId) {
            $patterns[] = "folders_index_{$userId}_{$parentId}_*";
        }

        foreach ($patterns as $pattern) {
            Cache::forget($pattern);
        }




        $versionKey = "folders_version_{$userId}";
        try {
            Cache::increment($versionKey);
        } catch (\Throwable $e) {
            $curr = Cache::get($versionKey, 0);
            Cache::put($versionKey, $curr + 1);
        }

        try {
            $new = Cache::get($versionKey, 0);
            Log::info('Cleared folder caches, bumped folders_version', ['user_id' => $userId, 'new_version' => $new, 'parent_id' => $parentId]);
        } catch (\Throwable $_) {

        }
    }

    /**
     * Clear file-related caches
     */
    public static function clearFileCaches(int $userId): void
    {
        $patterns = [
            "cloud_data_{$userId}_*",
            "file_stats_*",
            "starred_files_{$userId}_*",
        ];

        foreach ($patterns as $pattern) {
            Cache::forget($pattern);
        }


        $versionKey = "folders_version_{$userId}";
        try {
            Cache::increment($versionKey);
        } catch (\Throwable $e) {
            $curr = Cache::get($versionKey, 0);
            Cache::put($versionKey, $curr + 1);
        }

        $cloudKey = "cloud_data_{$userId}_version";
        try {
            Cache::increment($cloudKey);
        } catch (\Throwable $e) {
            $curr = Cache::get($cloudKey, 0);
            Cache::put($cloudKey, $curr + 1);
        }

        try {
            $new = Cache::get($versionKey, 0);
            Log::info('Cleared file caches, bumped folders_version and cloud_data_version', ['user_id' => $userId, 'folders_version' => $new]);
        } catch (\Throwable $_) {

        }
    }

    /**
     * Warm up caches for better performance
     */
    public static function warmUpCaches(User $user): void
    {

        self::getUsersForSharing($user->id);


        $fqcn = '\\App\\Http\\Controllers\\OptimizedCloudController';
        if (class_exists($fqcn)) {
            try {
                $cloudController = app()->make($fqcn);
                if (method_exists($cloudController, 'getCloudData')) {
                    $cloudData = $cloudController->getCloudData($user->id, $user);
                    self::setCloudData($user, $cloudData);
                }
            } catch (\Throwable $e) {

            }
        }
    }

    /**
     * Get cache key for cloud data
     */
    public static function getCloudCacheKey(User $user): string
    {
        $role = $user->isSuperAdmin() ? 'super' : ($user->isAdmin() ? 'admin' : 'user');
        $version = Cache::get("cloud_data_{$user->id}_version", 0);
        return "cloud_data_{$user->id}_{$role}_v{$version}";
    }

    /**
     * Get cache statistics
     */
    public static function getCacheStats(): array
    {
        return [
            'cache_driver' => config('cache.default'),
            'cache_prefix' => config('cache.prefix'),
            'memory_usage' => memory_get_usage(true),
            'memory_peak' => memory_get_peak_usage(true),
        ];
    }

    /**
     * Clear all application caches
     */
    public static function clearAllCaches(): void
    {
        Cache::flush();
    }
}
