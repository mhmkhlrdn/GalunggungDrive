<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use App\Models\FileShare;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Crypt;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        // Get real statistics - Global stats for all users
        $stats = [
            'totalFiles' => File::count(),
            'totalFolders' => Folder::count(),
            'storageUsed' => $user->formatted_storage_used,
            'storageLimit' => '100 GB', // You can make this configurable
            'recentActivity' => ActivityLog::count(),
            'sharedFiles' => FileShare::count(),
        ];

        // Get recent files from all users globally (only public files)
        $recentFiles = File::with(['folder', 'user'])
            ->where('visibility', 'public')
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'type' => $this->getFileType($file->mime_type),
                    'mime_type' => $file->mime_type,
                    'size' => $this->formatFileSize($file->size),
                    'modified' => $file->updated_at->diffForHumans(),
                    'created_at' => $file->created_at->toISOString(),
                    'description' => $file->description,
                    'tags' => $file->tags,
                    'starred' => false, // You can add a starred field to files table
                    'folder_id' => $file->folder_id,
                    'uploader' => [
                        'id' => $file->user->id,
                        'name' => $file->user->name,
                        'email' => $file->user->email,
                    ],
                ];
            });

        // Get recent folders from all users globally (only public folders)
        $recentFolders = Folder::with('user')
            ->where('visibility', 'public')
            ->orderBy('updated_at', 'desc')
            ->limit(4)
            ->get()
            ->map(function ($folder) {
                return [
                    'id' => $folder->id,
                    'name' => $folder->name,
                    'files' => File::where('folder_id', $folder->id)->count(),
                    'modified' => $folder->updated_at->diffForHumans(),
                    'link' => route('folders.show', ['folder' => $folder->id]),
                    'creator' => [
                        'id' => $folder->user->id,
                        'name' => $folder->user->name,
                        'email' => $folder->user->email,
                    ],
                ];
            });

        $availableDisks = collect(config('filesystems.disks', []))
            ->map(function ($config, $key) {
                return [
                    'key' => $key,
                    'label' => ucfirst($key),
                ];
            })
            ->values();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentFiles' => $recentFiles,
            'recentFolders' => $recentFolders,
            'disks' => $availableDisks,
        ]);
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

    private function formatFileSize($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}
