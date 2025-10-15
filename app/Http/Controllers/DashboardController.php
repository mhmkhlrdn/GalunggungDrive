<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use App\Models\FileShare;
use App\Models\FileVersion;
use App\Models\ActivityLog;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Crypt;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $users = \App\Models\User::where('id', '!=', $user->id)->get();

        $totalUsedSpace = File::sum('size') + FileVersion::sum('size');

        $totalStorageSpace = 0; // total capacity
        $totalFreeSpace = 0; // free space
        $locations = StorageLocation::where('is_active', true)->get();
        foreach ($locations as $location) {
            if ($location->root && @is_dir($location->root)) {
                try {
                    $diskTotal = @disk_total_space($location->root);
                    $diskFree = @disk_free_space($location->root);
                    if ($diskTotal !== false) { $totalStorageSpace += $diskTotal; }
                    if ($diskFree !== false) { $totalFreeSpace += $diskFree; }
                } catch (\Throwable $e) {
                    continue;
                }
            }
        }


        if ($totalStorageSpace === 0) {
            $totalStorageSpace = 100 * 1024 * 1024 * 1024; // 100GB
        }


        $stats = [
            'totalFiles' => File::whereHas('storageLocation', function ($query) {
    $query->where('is_active', true);
})->count(),
            'totalFolders' => Folder::count(),
            'storageUsed' => $this->formatFileSize($totalUsedSpace),
            'storageLimit' => $this->formatFileSize($totalFreeSpace),
            'totalStorageSpace' => $totalStorageSpace,
            'totalUsedSpace' => $totalUsedSpace,
            'recentActivity' => ActivityLog::count(),
            'sharedFiles' => FileShare::count(),
        ];


        $recentFiles = File::with(['folder', 'user', 'storageLocation'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
            ->where('visibility', 'public')
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($file) use ($user) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'type' => $this->getFileType($file->mime_type),
                    'mime_type' => $file->mime_type,
                    'size' => $file->size,
                    'modified' => $file->updated_at->diffForHumans(),
                    'created_at' => $file->created_at->toISOString(),
                    'description' => $file->description,
                    'tags' => $file->tags,
                    'starred' => $file->isStarredBy($user),
                    'folder_id' => $file->folder_id,
                    'uploader' => [
                        'id' => $file->user->id,
                        'name' => $file->user->name,
                        'email' => $file->user->email,
                    ],
                ];
            });


        $recentFolders = Folder::with('user')
            ->where('visibility', 'public')
            ->orderBy('updated_at', 'desc')
            ->limit(4)
            ->get()
            ->map(function ($folder) {
                return [
                    'id' => $folder->id,
                    'name' => $folder->name,
                    'files' => File::where('folder_id', $folder->id)
                        ->whereHas('storageLocation', function ($q) {
                            $q->where('is_active', true);
                        })
                        ->count(),
                    'modified' => $folder->updated_at->diffForHumans(),
                    'link' => route('folders.show', ['folder' => $folder->id]),
                    'creator' => [
                        'id' => $folder->user->id,
                        'name' => $folder->user->name,
                        'email' => $folder->user->email,
                    ],
                ];
            });

        $availableDisks = StorageLocation::serving()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'users' => $users,
            'recentFiles' => $recentFiles,
            'recentFolders' => $recentFolders,
            'disks' => $availableDisks->map(function ($loc) { return ['id' => $loc->id, 'name' => $loc->name]; }),
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

    private function getFileType($mimeType)
    {
        if (str_starts_with($mimeType, 'image/')) return 'image';
        if (str_starts_with($mimeType, 'video/')) return 'video';
        if (str_starts_with($mimeType, 'audio/')) return 'audio';
        if ($mimeType === 'application/pdf') return 'pdf';
        if (str_contains($mimeType, 'word')) return 'docx';
        if (str_contains($mimeType, 'excel') || str_contains($mimeType, 'spreadsheet')) return 'xlsx';
        if (str_contains($mimeType, 'zip') || str_contains($mimeType, 'rar') || str_contains($mimeType, '7z')) return 'archive';
        return 'file';
    }

}
