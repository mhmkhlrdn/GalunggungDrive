<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TrashController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $search = $request->get('search');
        $type = $request->get('type', 'all');
        $sortBy = $request->get('sort_by', 'deleted_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $filesQuery = File::onlyTrashed()
            ->where('user_id', $user->id)
            ->with(['user', 'folder']);

        $foldersQuery = Folder::onlyTrashed()
            ->where('user_id', $user->id);

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

        return Inertia::render('trash/index', [
            'files' => $files,
            'folders' => $folders,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    public function restoreFile(int $fileId): RedirectResponse
    {
        $file = File::withTrashed()->where('id', $fileId)->where('user_id', auth()->id())->firstOrFail();
        $this->authorize('restore', $file);
        $file->restore();
        return redirect()->back()->with('success', 'File restored successfully.');
    }

    public function restoreFolder(int $folderId): RedirectResponse
    {
        $folder = Folder::withTrashed()->where('id', $folderId)->where('user_id', auth()->id())->firstOrFail();
        $this->authorize('restore', $folder);
        $folder->restore();
        return redirect()->back()->with('success', 'Folder restored successfully.');
    }

    public function destroyFilePermanently(int $fileId): RedirectResponse
    {
        $file = File::withTrashed()->where('id', $fileId)->where('user_id', auth()->id())->firstOrFail();
        $this->authorize('delete', $file);
        $this->deletePhysicalFileAndVersions($file);
        $file->forceDelete();
        return redirect()->back()->with('success', 'File permanently deleted.');
    }

    public function destroyFolderPermanently(int $folderId): RedirectResponse
    {
        $folder = Folder::withTrashed()->where('id', $folderId)->where('user_id', auth()->id())->firstOrFail();
        $this->authorize('delete', $folder);
        $folder->forceDelete();
        return redirect()->back()->with('success', 'Folder permanently deleted.');
    }

    public function empty(Request $request): RedirectResponse
    {
        $userId = auth()->id();

        // Permanently delete all trashed files and folders owned by the user
        File::onlyTrashed()->where('user_id', $userId)->get()->each(function (File $file) {
            $this->deletePhysicalFileAndVersions($file);
            $file->forceDelete();
        });
        Folder::onlyTrashed()->where('user_id', $userId)->forceDelete();

        return redirect()->back()->with('success', 'Trash emptied successfully.');
    }

    private function deletePhysicalFileAndVersions(File $file): void
    {
        try {
            // Delete the main file if exists
            if ($file->disk && $file->path) {
                try { Storage::disk($file->disk)->delete($file->path); } catch (\Throwable $e) { /* ignore */ }
            }

            // Delete all version files if any
            $file->versions()->each(function ($version) use ($file) {
                if ($version->path) {
                    try { Storage::disk($file->disk)->delete($version->path); } catch (\Throwable $e) { /* ignore */ }
                }
            });
        } catch (\Throwable $e) {
            // swallow storage errors to not block DB cleanup
        }
    }
}
