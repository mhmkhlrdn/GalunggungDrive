<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileShare;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FileShareController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        
        try {
            // Get files shared by the user
            $sharedByMe = FileShare::with(['file', 'sharedWith'])
                ->where('shared_by', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);
            
            // Get files shared with the user
            $sharedWithMe = FileShare::with(['file', 'sharedBy'])
                ->where('shared_with', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate(20);
            
            // Get public links created by the user
            $publicLinks = FileShare::with(['file'])
                ->where('shared_by', $user->id)
                ->where('is_public_link', true)
                ->orderBy('created_at', 'desc')
                ->paginate(20);
        } catch (\Exception $e) {
            // If there's an error, return empty paginated results
            $sharedByMe = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 20);
            $sharedWithMe = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 20);
            $publicLinks = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 20);
            
            \Log::error('FileShareController error: ' . $e->getMessage());
        }

        // Get all files for sharing
        $files = File::with('folder')
            ->where('user_id', $user->id)
            ->select('id', 'name', 'mime_type', 'size', 'folder_id')
            ->get()
            ->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'mime_type' => $file->mime_type,
                    'size' => $this->formatFileSize($file->size),
                    'folder' => $file->folder ? [
                        'id' => $file->folder->id,
                        'name' => $file->folder->name,
                    ] : null,
                ];
            });

        // Get all users for sharing
        $users = User::where('id', '!=', $user->id)
            ->select('id', 'name', 'email')
            ->get();

        return Inertia::render('shared/index', [
            'sharedByMe' => $sharedByMe,
            'sharedWithMe' => $sharedWithMe,
            'publicLinks' => $publicLinks,
            'files' => $files,
            'users' => $users,
        ]);
    }

    public function create(File $file): Response
    {
        $this->authorize('view', $file);
        
        $users = User::where('id', '!=', auth()->id())
            ->select('id', 'name', 'email')
            ->get();

        return Inertia::render('Files/Share', [
            'file' => $file,
            'users' => $users,
        ]);
    }

    public function store(Request $request, File $file): RedirectResponse
    {
        $this->authorize('view', $file);

        $request->validate([
            'shared_with' => 'nullable|exists:users,id',
            'permission' => 'required|in:view,edit,download',
            'expires_at' => 'nullable|date|after:now',
            'is_public_link' => 'boolean',
        ]);

        // Check if it's a public link or user-specific share
        if ($request->is_public_link) {
            $token = Str::random(32);
            $sharedWith = null;
        } else {
            $token = null;
            $sharedWith = $request->shared_with;
            
            // Check if already shared with this user
            $existingShare = FileShare::where('file_id', $file->id)
                ->where('shared_with', $sharedWith)
                ->first();
                
            if ($existingShare) {
                return redirect()->back()->with('error', 'File sudah dibagikan dengan pengguna ini.');
            }
        }

        $share = FileShare::create([
            'file_id' => $file->id,
            'shared_by' => auth()->id(),
            'shared_with' => $sharedWith,
            'permission' => $request->permission,
            'expires_at' => $request->expires_at,
            'token' => $token,
            'is_public_link' => $request->is_public_link ?? false,
        ]);

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'share',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'success' => true,
            'details' => [
                'file_name' => $file->name,
                'shared_with' => $sharedWith ? User::find($sharedWith)->name : 'Public Link',
                'permission' => $request->permission,
                'expires_at' => $request->expires_at,
            ],
        ]);

        $message = $request->is_public_link 
            ? 'Link publik berhasil dibuat.' 
            : 'File berhasil dibagikan.';

        return redirect()->back()->with('success', $message);
    }

    public function update(Request $request, FileShare $fileShare): RedirectResponse
    {
        $this->authorize('update', $fileShare);

        $request->validate([
            'permission' => 'required|in:view,edit,download',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $fileShare->update([
            'permission' => $request->permission,
            'expires_at' => $request->expires_at,
        ]);

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'share',
            'target_type' => 'file',
            'target_id' => $fileShare->file_id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'success' => true,
            'details' => [
                'action' => 'update_share',
                'file_name' => $fileShare->file->name,
                'permission' => $request->permission,
            ],
        ]);

        return redirect()->back()->with('success', 'Pengaturan berbagi berhasil diperbarui.');
    }

    public function destroy(FileShare $fileShare): RedirectResponse
    {
        $this->authorize('delete', $fileShare);

        $fileName = $fileShare->file->name;
        $fileShare->delete();

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'share',
            'target_type' => 'file',
            'target_id' => $fileShare->file_id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'action' => 'remove_share',
                'file_name' => $fileName,
            ],
        ]);

        return redirect()->back()->with('success', 'Berbagi file berhasil dihapus.');
    }

    public function publicAccess(string $token)
    {
        $share = FileShare::where('token', $token)
            ->where('is_public_link', true)
            ->with('file')
            ->first();

        if (!$share) {
            abort(404, 'Link tidak ditemukan atau sudah tidak valid.');
        }

        if ($share->expires_at && $share->expires_at->isPast()) {
            abort(410, 'Link sudah kedaluwarsa.');
        }

        $file = $share->file;

        // Log access
        ActivityLog::create([
            'user_id' => null, // Anonymous access
            'action' => 'download',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'file_name' => $file->name,
                'access_type' => 'public_link',
                'token' => $token,
            ],
        ]);

        return Inertia::render('Files/PublicView', [
            'file' => $file,
            'share' => $share,
        ]);
    }

    public function publicDownload(string $token)
    {
        $share = FileShare::where('token', $token)
            ->where('is_public_link', true)
            ->with('file')
            ->first();

        if (!$share) {
            abort(404, 'Link tidak ditemukan atau sudah tidak valid.');
        }

        if ($share->expires_at && $share->expires_at->isPast()) {
            abort(410, 'Link sudah kedaluwarsa.');
        }

        $file = $share->file;

        // Log download
        ActivityLog::create([
            'user_id' => null,
            'action' => 'download',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'file_name' => $file->name,
                'access_type' => 'public_download',
                'token' => $token,
            ],
        ]);

        return \Storage::disk($file->disk)->download($file->path, $file->name);
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
