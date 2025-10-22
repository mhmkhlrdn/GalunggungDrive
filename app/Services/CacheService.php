<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\File;
use App\Models\Folder;

class CacheService
{
    const CACHE_TTL = 300; // 5 minutes
    const LONG_CACHE_TTL = 600; // 10 minutes
    const SHORT_CACHE_TTL = 60; // 1 minute

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
        $cacheKey = "folder_show_{$folderId}_{$userId}";
        return Cache::get($cacheKey);
    }

    /**
     * Set cached folder data
     */
    public static function setFolderData(int $folderId, int $userId, array $data): void
    {
        $cacheKey = "folder_show_{$folderId}_{$userId}";
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
    }

    /**
     * Warm up caches for better performance
     */
    public static function warmUpCaches(User $user): void
    {
        // Pre-load commonly accessed data
        self::getUsersForSharing($user->id);
        
        // Pre-load cloud data
        $cloudController = new \App\Http\Controllers\OptimizedCloudController();
        $cloudData = $cloudController->getCloudData($user->id, $user);
        self::setCloudData($user, $cloudData);
    }

    /**
     * Get cache key for cloud data
     */
    private static function getCloudCacheKey(User $user): string
    {
        $role = $user->isSuperAdmin() ? 'super' : ($user->isAdmin() ? 'admin' : 'user');
        return "cloud_data_{$user->id}_{$role}";
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
