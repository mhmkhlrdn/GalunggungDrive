<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileShare;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FileShareController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();

        try {
            // Get files shared by the user - group by file to avoid duplicates
            $sharedByMeFiles = File::with(['shares' => function($query) use ($user) {
                $query->where('shared_by', $user->id)
                      ->with('sharedWith');
            }])
            ->whereHas('shares', function($query) use ($user) {
                $query->where('shared_by', $user->id);
            })
            ->orderBy('updated_at', 'desc')
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
            $sharedByMeFiles = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 20);
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
            'sharedByMe' => [
                'data' => $sharedByMeFiles->items(),
                'meta' => [
                    'current_page' => $sharedByMeFiles->currentPage(),
                    'last_page' => $sharedByMeFiles->lastPage(),
                    'per_page' => $sharedByMeFiles->perPage(),
                    'total' => $sharedByMeFiles->total(),
                ],
                'links' => [
                    'first' => $sharedByMeFiles->url(1),
                    'last' => $sharedByMeFiles->url($sharedByMeFiles->lastPage()),
                    'prev' => $sharedByMeFiles->previousPageUrl(),
                    'next' => $sharedByMeFiles->nextPageUrl(),
                ],
            ],
            'sharedWithMe' => [
                'data' => $sharedWithMe->items(),
                'meta' => [
                    'current_page' => $sharedWithMe->currentPage(),
                    'last_page' => $sharedWithMe->lastPage(),
                    'per_page' => $sharedWithMe->perPage(),
                    'total' => $sharedWithMe->total(),
                ],
                'links' => [
                    'first' => $sharedWithMe->url(1),
                    'last' => $sharedWithMe->url($sharedWithMe->lastPage()),
                    'prev' => $sharedWithMe->previousPageUrl(),
                    'next' => $sharedWithMe->nextPageUrl(),
                ],
            ],
            'publicLinks' => [
                'data' => $publicLinks->items(),
                'meta' => [
                    'current_page' => $publicLinks->currentPage(),
                    'last_page' => $publicLinks->lastPage(),
                    'per_page' => $publicLinks->perPage(),
                    'total' => $publicLinks->total(),
                ],
                'links' => [
                    'first' => $publicLinks->url(1),
                    'last' => $publicLinks->url($publicLinks->lastPage()),
                    'prev' => $publicLinks->previousPageUrl(),
                    'next' => $publicLinks->nextPageUrl(),
                ],
            ],
            'files' => $files,
            'users' => $users,
        ]);
    }

    public function getExistingShares(Request $request)
    {
        $fileIds = $request->input('file_ids', []);
        $user = auth()->user();

        $shares = FileShare::with(['sharedWith', 'sharedBy'])
            ->whereIn('file_id', $fileIds)
            ->where('shared_by', $user->id)
            ->get()
            ->map(function ($share) {
                return [
                    'id' => $share->id,
                    'file_id' => $share->file_id,
                    'shared_with' => $share->shared_with,
                    'shared_by' => $share->shared_by,
                    'permission' => $share->permission,
                    'is_public_link' => $share->is_public_link,
                    'expires_at' => $share->expires_at,
                    'shared_with_user' => $share->sharedWith ? [
                        'id' => $share->sharedWith->id,
                        'name' => $share->sharedWith->name,
                        'email' => $share->sharedWith->email,
                    ] : null,
                ];
            });

        return response()->json([
            'shares' => $shares,
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
            ->with(['file.user'])
            ->first();

        if (!$share || !$share->file) {
            abort(404, 'Link tidak ditemukan atau sudah tidak valid.');
        }

        if ($share->expires_at && $share->expires_at->isPast()) {
            abort(410, 'Link sudah kedaluwarsa.');
        }

        $file = $share->file;

        $fileData = [
            'id' => $file->id,
            'name' => $file->name,
            'size' => $file->size,
            'mime_type' => $file->mime_type,
            'description' => $file->description,
            'created_at' => $file->created_at?->toISOString(),
            'updated_at' => $file->updated_at?->toISOString(),
            'owner' => $file->user ? [
                'name' => $file->user->name,
                'email' => $file->user->email,
            ] : null,
        ];

        $shareData = [
            'token' => $share->token,
            'permission' => $share->permission,
            'expires_at' => $share->expires_at?->toISOString(),
            'created_at' => $share->created_at?->toISOString(),
            'is_public_link' => $share->is_public_link,
        ];

        $publicUrl = route('public.file', $share->token);
        $downloadUrl = route('public.file.download', $share->token);

        // Log access (view)
        ActivityLog::create([
            'user_id' => null, // Anonymous access
            'action' => 'preview',
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
            'file' => $fileData,
            'share' => $shareData,
            'downloadUrl' => $downloadUrl,
            'publicUrl' => $publicUrl,
            'canDownload' => in_array($share->permission, ['download', 'edit']),
        ]);
    }


    public function publicDownload(string $token)
    {
        $share = FileShare::where('token', $token)
            ->where('is_public_link', true)
            ->with(['file.storageLocation'])
            ->first();

        if (!$share || !$share->file) {
            abort(404, 'Link tidak ditemukan atau sudah tidak valid.');
        }

        if ($share->expires_at && $share->expires_at->isPast()) {
            abort(410, 'Link sudah kedaluwarsa.');
        }

        // Check if download permission is granted
        if (!in_array($share->permission, ['download', 'edit'])) {
            abort(403, 'Anda tidak memiliki izin untuk mengunduh file ini.');
        }

        $file = $share->file;

        // Check if storage location is active
        if (!$file->storageLocation || !$file->storageLocation->is_active) {
            abort(404, 'File tidak ditemukan.');
        }

        $diskKey = $file->storageLocation->diskKey();
        if (!Storage::disk($diskKey)->exists($file->path)) {
            abort(404, 'File tidak ditemukan.');
        }

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

        return response()->download(Storage::disk($diskKey)->path($file->path), $file->name);
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
