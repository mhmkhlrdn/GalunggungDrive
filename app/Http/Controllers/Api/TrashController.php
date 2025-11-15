<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TrashController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isAdmin = in_array($user->role, ['admin', 'super-admin']);

        $search = $request->get('search');
        $type = $request->get('type', 'all');
        $sortBy = $request->get('sort_by', 'deleted_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $filesQuery = File::onlyTrashed()->with(['user', 'folder']);
        $foldersQuery = Folder::onlyTrashed();

        if (!$isAdmin) {
            $filesQuery->where('user_id', $user->id);
            $foldersQuery->where('user_id', $user->id);
        }

        if ($search) {
            $filesQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
            $foldersQuery->where('name', 'like', "%{$search}%");
        }

        $files = null;
        $folders = null;

        if ($type === 'all' || $type === 'files') {
            $files = $filesQuery->orderBy($sortBy, $sortOrder)->paginate(20);
        }

        if ($type === 'all' || $type === 'folders') {
            $folders = $foldersQuery->orderBy($sortBy, $sortOrder)->paginate(20);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'files' => $files ? $files->items() : [],
                'folders' => $folders ? $folders->items() : [],
            ],
            'meta' => [
                'files' => $files ? [
                    'current_page' => $files->currentPage(),
                    'last_page' => $files->lastPage(),
                    'total' => $files->total(),
                ] : null,
                'folders' => $folders ? [
                    'current_page' => $folders->currentPage(),
                    'last_page' => $folders->lastPage(),
                    'total' => $folders->total(),
                ] : null,
            ],
        ]);
    }

    public function empty(Request $request)
    {
        $user = Auth::user();
        $isAdmin = in_array($user->role, ['admin', 'super-admin']);

        $fileQuery = File::onlyTrashed();
        $folderQuery = Folder::onlyTrashed();

        if (!$isAdmin) {
            $fileQuery->where('user_id', $user->id);
            $folderQuery->where('user_id', $user->id);
        }

        $fileQuery->get()->each(function (File $file) {
            $this->deletePhysicalFileAndVersions($file);
            $file->forceDelete();
        });

        $folderQuery->get()->each(function (Folder $folder) {
            $folder->forceDelete();
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Trash emptied successfully',
        ]);
    }

    public function restoreFile(int $fileId)
    {
        $file = File::withTrashed()->where('id', $fileId)->firstOrFail();
        $this->authorize('restore', $file);
        $file->restore();

        return response()->json([
            'status' => 'success',
            'message' => 'File restored successfully',
        ]);
    }

    public function destroyFilePermanently(int $fileId)
    {
        $file = File::withTrashed()->where('id', $fileId)->firstOrFail();
        $this->authorize('delete', $file);
        $this->deletePhysicalFileAndVersions($file);
        $file->forceDelete();

        return response()->json([
            'status' => 'success',
            'message' => 'File permanently deleted',
        ]);
    }

    public function restoreFolder(int $folderId)
    {
        $folder = Folder::withTrashed()->where('id', $folderId)->firstOrFail();
        $this->authorize('restore', $folder);
        $folder->restore();

        return response()->json([
            'status' => 'success',
            'message' => 'Folder restored successfully',
        ]);
    }

    public function destroyFolderPermanently(int $folderId)
    {
        $folder = Folder::withTrashed()->where('id', $folderId)->firstOrFail();
        $this->authorize('delete', $folder);
        $folder->forceDelete();

        return response()->json([
            'status' => 'success',
            'message' => 'Folder permanently deleted',
        ]);
    }

    private function deletePhysicalFileAndVersions(File $file): void
    {
        try {
            if ($file->disk && $file->path) {
                try {
                    $diskKey = $file->storageLocation ? $file->storageLocation->diskKey() : 'private';
                    Storage::disk($diskKey)->delete($file->path);
                } catch (\Throwable $e) { /* ignore */ }
            }

            $file->versions()->each(function ($version) use ($file) {
                if ($version->path) {
                    try {
                        $diskKey = $file->storageLocation ? $file->storageLocation->diskKey() : 'private';
                        Storage::disk($diskKey)->delete($version->path);
                    } catch (\Throwable $e) { /* ignore */ }
                }
            });
        } catch (\Throwable $e) {
            // swallow storage errors
        }
    }
}

