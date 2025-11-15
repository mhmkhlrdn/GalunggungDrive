<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\Folder;
use App\Models\FileShare;
use App\Models\ActivityLog;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StorageController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $totalFiles = File::where('user_id', $user->id)->count();
        $totalFolders = Folder::where('user_id', $user->id)->count();
        $sharedFiles = FileShare::where('shared_by', $user->id)->count();

        $usedSpace = File::where('user_id', $user->id)->sum('size');
        $totalSpace = (int) ($user->storage_limit ?? (100 * 1024 * 1024 * 1024));
        $availableSpace = max(0, $totalSpace - $usedSpace);

        $stats = [
            'totalSpace' => $totalSpace,
            'usedSpace' => $usedSpace,
            'availableSpace' => $availableSpace,
            'totalFiles' => $totalFiles,
            'totalFolders' => $totalFolders,
            'sharedFiles' => $sharedFiles,
            'recentUploads' => File::where('user_id', $user->id)
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
        ];

        $fileTypeStats = File::where('user_id', $user->id)
            ->selectRaw('
                CASE
                    WHEN mime_type LIKE "image/%" THEN "Images"
                    WHEN mime_type LIKE "video/%" THEN "Videos"
                    WHEN mime_type LIKE "audio/%" THEN "Audio"
                    WHEN mime_type = "application/pdf" THEN "PDFs"
                    WHEN mime_type LIKE "%word%" THEN "Documents"
                    WHEN mime_type LIKE "%excel%" OR mime_type LIKE "%spreadsheet%" THEN "Spreadsheets"
                    WHEN mime_type LIKE "%zip%" OR mime_type LIKE "%rar%" OR mime_type LIKE "%7z%" THEN "Archives"
                    ELSE "Other"
                END as type,
                COUNT(*) as count,
                SUM(size) as size
            ')
            ->groupBy('type')
            ->get()
            ->map(function ($item, $index) use ($totalFiles, $usedSpace) {
                $colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
                return [
                    'type' => $item->type,
                    'count' => $item->count,
                    'size' => $item->size,
                    'percentage' => $totalFiles > 0 ? round(($item->count / $totalFiles) * 100, 1) : 0,
                    'color' => $colors[$index % count($colors)],
                ];
            });

        $recentActivity = ActivityLog::where('user_id', $user->id)
            ->whereIn('action', ['upload', 'download', 'share', 'delete'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => ucfirst($log->action),
                    'file_name' => $log->details['file_name'] ?? 'Unknown',
                    'size' => $this->formatFileSize($log->details['file_size'] ?? 0),
                    'timestamp' => $log->created_at->toISOString(),
                ];
            });

        $locations = [];
        if (in_array($user->role, ['admin', 'super-admin'])) {
            $locations = StorageLocation::where('is_active', true)
                ->get()
                ->map(function ($loc) {
                    $diskKey = $loc->key;
                    $diskConfig = config("filesystems.disks.$diskKey", []);
                    $root = $diskConfig['root'] ?? $loc->root ?? null;
                    $total = null;
                    $free = null;
                    if ($root && @is_dir($root)) {
                        try {
                            $total = @disk_total_space($root) ?: null;
                            $free = @disk_free_space($root) ?: null;
                        } catch (\Throwable $e) {
                            $total = null;
                            $free = null;
                        }
                    }
                    return [
                        'id' => $loc->id,
                        'name' => $loc->name,
                        'key' => $loc->key,
                        'driver' => $loc->driver,
                        'root' => $root,
                        'total' => $total,
                        'free' => $free,
                        'available' => is_null($total) || is_null($free) ? null : max(0, $total - ($total - $free)),
                    ];
                });
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'stats' => $stats,
                'fileTypeStats' => $fileTypeStats,
                'recentActivity' => $recentActivity,
                'locations' => $locations,
            ],
        ]);
    }

    private function formatFileSize($bytes)
    {
        if ($bytes === 0) return '0 Bytes';
        $k = 1024;
        $sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        $i = floor(log($bytes) / log($k));
        return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
    }
}

