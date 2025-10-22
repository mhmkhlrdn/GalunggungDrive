<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use App\Models\ActivityLog;
use App\Models\FileShare;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Models\StorageLocation;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;

class FileController extends Controller
{
    private function pickStorageDisk(): string
    {
        try {
            $locations = \App\Models\StorageLocation::query()
                ->where('is_active', true)
                ->get();

            $candidates = [];
            foreach ($locations as $loc) {
                if ($loc->root) {
                    try {
                        $freeBytes = @disk_free_space($loc->root);
                        if ($freeBytes !== false) {
                            $candidates[] = [
                                'key' => $loc->diskKey(),
                                'free' => (int) $freeBytes,
                            ];
                        }
                    } catch (\Throwable $e) {
                    }
                }
            }

            if (!empty($candidates)) {
                usort($candidates, function ($a, $b) { return $b['free'] <=> $a['free']; });
                return $candidates[0]['key'];
            }
        } catch (\Throwable $e) {
        }

        return config('upload.storage_disk') ?? 'private';
    }
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $folderId = $request->get('folder_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $query = File::with(['user', 'folder', 'storageLocation'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            });

        if ($user->is_super_admin || ($user->is_admin ?? false)) {

        } elseif (($user->role ?? null) === 'staff') {

            $query->where('user_id', $user->id);
        } else {

            $query->where('user_id', $user->id);
        }

        if ($folderId) {
            $query->where('folder_id', $folderId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        $files = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        $files->getCollection()->transform(function ($file) use ($user) {
            $file->starred = $file->isStarredBy($user);
            return $file;
        });

        $currentFolder = $folderId ? Folder::find($folderId) : null;
        $breadcrumbs = $this->getBreadcrumbs($currentFolder);

        $allFolders = Folder::where(function ($q) use ($user) {
                if ($user->isStaff() && !$user->isAdmin()) {
                    $q->where('user_id', $user->id);
                } else {
                    $q->where('user_id', $user->id)
                      ->orWhere('visibility', 'public');
                }
            })
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);

        $users = \App\Models\User::where('id', '!=', $user->id)
            ->select('id', 'name', 'email')
            ->get();


        $activeServingLocations = StorageLocation::serving()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Files/Index', [
            'files' => $files,
            'currentFolder' => $currentFolder,
            'breadcrumbs' => $breadcrumbs,
            'folders' => $allFolders,
            'users' => $users,
            'disks' => $activeServingLocations->map(function ($loc) { return ['id' => $loc->id, 'name' => $loc->name]; }),
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $uploadConfig = config('upload', []);

        $validationRules = [
            'files' => 'required|array|min:1',
            'files.*' => 'file',
            'relative_paths' => 'nullable|array',
            'relative_paths.*' => 'string',
            'folder_id' => 'nullable|exists:folders,id',
            'disk_id' => 'required|integer|exists:storage_locations,id',
            'description' => 'nullable|string|max:1000',
            'tags' => 'nullable|string',
            'visibility' => 'required|in:private,shared,public',
        ];


        $allFiles = $request->allFiles();
        $filesArr = $allFiles['files'] ?? [];


        Log::info('File upload debug', [
            'all_files_keys' => array_keys($allFiles),
            'files_array_structure' => is_array($filesArr) ? array_keys($filesArr) : gettype($filesArr),
            'files_count' => is_array($filesArr) ? count($filesArr) : 0,
        ]);


        $flattenedFiles = [];
        $this->flattenFilesArray($filesArr, $flattenedFiles);

        if (count($flattenedFiles)) {
            foreach ($flattenedFiles as $uploadedFile) {
                Log::info('Upload attempt', [
                    'original_name' => $uploadedFile->getClientOriginalName(),
                    'mime_type' => $uploadedFile->getMimeType(),
                    'extension' => $uploadedFile->getClientOriginalExtension(),
                    'size' => $uploadedFile->getSize(),
                ]);
            }
        } else {
            Log::warning('No files found in upload request');
        }

         if ($user && $user->isStaff()) {
 $validationRules['visibility'] = 'required|in:public';
}

        try {
            $validated = $request->validate($validationRules);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('File upload validation failed', [
                'errors' => $e->errors(),
            ]);
            throw $e;
        }


        $storageLocation = StorageLocation::active()->where('id', $validated['disk_id'])->first();
        if (!$storageLocation) {
            Log::error('Storage location not active', ['disk_id' => $validated['disk_id']]);
            return redirect()->back()->withErrors(['disk_id' => 'Lokasi penyimpanan tidak aktif.']);
        }
        if (!(bool) ($storageLocation->can_serve ?? false)) {
            Log::error('Storage location cannot serve uploads', ['disk_id' => $validated['disk_id']]);
            return redirect()->back()->withErrors(['disk_id' => 'Lokasi penyimpanan tidak tersedia untuk upload.']);
        }

        $storageDisk = $storageLocation->diskKey();

        $uploadedFiles = [];

    $relativePaths = $request->input('relative_paths', []);


        $folderMap = [];
        if (!empty($relativePaths)) {
            $folderMap = $this->createFolderHierarchy($relativePaths, $request->folder_id, $request->visibility);
        }


    $files = $flattenedFiles;
    foreach ($files as $i => $uploadedFile) {
            $storagePath = $uploadConfig['storage_path'] ?? 'files';
            $relativePath = isset($relativePaths[$i]) ? $relativePaths[$i] : $uploadedFile->getClientOriginalName();
            $targetPath = $storagePath;
            if ($relativePath && $relativePath !== $uploadedFile->getClientOriginalName()) {

                $directory = dirname($relativePath);
                if ($directory === '.') {
                    $targetPath = $storagePath;
                } else {
                    $targetPath = rtrim($storagePath, '/') . '/' . ltrim($directory, '/');
                }
            }
            Log::info('Attempting to store file', [
                'storage_path' => $targetPath,
                'storage_disk' => $storageDisk,
                'original_name' => $uploadedFile->getClientOriginalName(),
                'relative_path' => $relativePath,
            ]);
            try {

                Storage::disk($storageDisk)->makeDirectory($targetPath);
                $path = $uploadedFile->storeAs($targetPath, basename($uploadedFile->getClientOriginalName()), $storageDisk);
                Log::info('File stored successfully', ['path' => $path, 'disk' => $storageDisk]);
            } catch (\Exception $e) {
                Log::error('File storage failed due to exception', [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]);
                return redirect()->back()->withErrors(['upload' => 'Gagal mengunggah file: ' . $e->getMessage()]);
            }

            if ($path === false) {
                Log::error('File storage returned false', [
                    'original_name' => $uploadedFile->getClientOriginalName(),
                    'storage_path' => $targetPath,
                    'storage_disk' => $storageDisk,
                    'message' => 'This often indicates a permissions issue or an invalid path on the filesystem. Check web server write permissions for the target directory and mount options for the FAT32 drive.',
                ]);
                return redirect()->back()->withErrors(['upload' => 'Gagal menyimpan file ke disk. Periksa izin direktori dan opsi mount drive.']);
            }

            if (is_null($path)) {
                Log::error('File path is null after successful storage operation (unexpected)', [
                    'original_name' => $uploadedFile->getClientOriginalName(),
                    'storage_path' => $targetPath,
                    'storage_disk' => $storageDisk,
                ]);
                return redirect()->back()->withErrors(['upload' => 'Gagal mendapatkan path file setelah diunggah (path null).']);
            }

            $checksum = hash_file('sha256', $uploadedFile->getRealPath());


            $fileFolderId = $request->folder_id;
            $directory = '.';
            if ($relativePath && $relativePath !== $uploadedFile->getClientOriginalName()) {

                $directory = dirname($relativePath);
                if ($directory !== '.') {
                    $fileFolderId = $folderMap[$directory] ?? $request->folder_id;
                }
            }

            Log::info('File folder assignment', [
                'file_name' => $uploadedFile->getClientOriginalName(),
                'relative_path' => $relativePath,
                'directory' => $directory,
                'folder_id' => $fileFolderId,
                'folder_map' => $folderMap,
            ]);

            $file = File::create([
                'user_id' => Auth::id(),
                'folder_id' => $fileFolderId,
                'name' => $uploadedFile->getClientOriginalName(),
                'path' => $path,
                'disk_id' => $storageLocation->id,
                'size' => $uploadedFile->getSize(),
                'mime_type' => $uploadedFile->getMimeType(),
                'checksum' => $checksum,
                'description' => $request->description,
                'visibility' => $request->visibility,
                'tags' => $request->tags ? explode(',', $request->tags) : null,
            ]);

            $file->versions()->create([
                'version_number' => 1,
                'path' => $path,
                'size' => $uploadedFile->getSize(),
                'mime_type' => $uploadedFile->getMimeType(),
                'checksum' => $checksum,
                'uploaded_by' => Auth::id(),
            ]);

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'upload',
                'target_type' => 'file',
                'target_id' => $file->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'success' => true,
                'details' => [
                    'file_name' => $file->name,
                    'file_size' => $file->size,
                    'mime_type' => $file->mime_type,
                ],
            ]);

            $uploadedFiles[] = $file;
        }

        // Clear relevant caches after file upload
        $this->clearFileCaches(Auth::id(), $request->folder_id);

        return redirect()->back()->with('success',
            count($uploadedFiles) . ' file berhasil diunggah.'
        );
    }

    public function show(File $file): Response
    {
        $this->authorize('view', $file);

        $file->load(['user', 'folder', 'versions.uploadedBy', 'shares.sharedWith', 'shares.sharedBy']);

        $shares = FileShare::where('file_id', $file->id)
            ->with(['sharedWith', 'sharedBy'])
            ->get();

        return Inertia::render('Files/Show', [
            'file' => $file,
            'shares' => $shares,
        ]);
    }

    public function update(Request $request, File $file): RedirectResponse
    {
        $this->authorize('update', $file);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'tags' => 'nullable|string',
            'visibility' => 'required|in:private,shared,public',
            'shared_with' => 'nullable|array',
            'shared_with.*' => 'integer|exists:users,id',
        ]);

        $oldData = [
            'name' => $file->name,
            'description' => $file->description,
            'tags' => $file->tags,
            'visibility' => $file->visibility,
        ];

        $file->update([
            'name' => $request->name,
            'description' => $request->description,
            'tags' => $request->tags ? explode(',', $request->tags) : null,
            'visibility' => $request->visibility,
        ]);

        if ($request->visibility === 'shared' && $request->has('shared_with')) {
            $file->shares()->delete();

            foreach ($request->shared_with as $userId) {
                $file->shares()->create([
                    'shared_with' => $userId,
                    'permission' => 'view',
                    'shared_by' => Auth::id(),
                ]);
            }
        } elseif ($request->visibility !== 'shared') {
            $file->shares()->delete();
        }

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'edit',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'success' => true,
            'details' => [
                'file_name' => $file->name,
                'changes' => array_diff_assoc([
                    'name' => $file->name,
                    'description' => $file->description,
                    'tags' => $file->tags,
                    'visibility' => $file->visibility,
                ], $oldData),
            ],
        ]);

        return redirect()->back()->with('success', 'File updated successfully.');
    }

    public function destroy(File $file): RedirectResponse
    {
        $this->authorize('delete', $file);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'file_name' => $file->name,
                'file_size' => $file->size,
            ],
        ]);

        $file->delete();

        // Clear relevant caches after file deletion
        $this->clearFileCaches(Auth::id(), $file->folder_id);

        return redirect()->back()->with('success', 'File deleted successfully.');
    }

    public function download(File $file)
    {
        $this->authorize('download', $file);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'download',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'file_name' => $file->name,
                'file_size' => $file->size,
            ],
        ]);


        if (!$file->storageLocation || !$file->storageLocation->is_active) {
            abort(404, 'File not found');
        }

        $diskKey = $file->storageLocation->diskKey();
        if (!Storage::disk($diskKey)->exists($file->path)) {
            abort(404, 'File not found');
        }

        return response()->download(Storage::disk($diskKey)->path($file->path), $file->name);
    }

    public function preview(File $file)
    {
        try {
            $this->authorize('view', $file);

            $errorId = (string) \Illuminate\Support\Str::uuid();
            $user = \Illuminate\Support\Facades\Auth::user();

            if (!$file->storageLocation || !$file->storageLocation->is_active) {
                \Illuminate\Support\Facades\Log::warning('Preview failed: inactive storage location', [
                    'error_id' => $errorId,
                    'file_id' => $file->id,
                    'user_id' => $user?->id,
                    'storage_location_id' => $file->storage_location_id,
                ]);
                abort(404, 'File not found');
            }
            $diskKey = $file->storageLocation->diskKey();
            $exists = false;
            try {
                $exists = Storage::disk($diskKey)->exists($file->path);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Preview storage check threw exception', [
                    'error_id' => $errorId,
                    'file_id' => $file->id,
                    'disk' => $diskKey,
                    'path' => $file->path,
                    'exception' => $e->getMessage(),
                ]);
                throw $e;
            }
            if (!$exists) {
                \Illuminate\Support\Facades\Log::warning('Preview failed: file missing on disk', [
                    'error_id' => $errorId,
                    'file_id' => $file->id,
                    'disk' => $diskKey,
                    'path' => $file->path,
                ]);
                abort(404, 'File not found');
            }

            \Illuminate\Support\Facades\Log::info('Preview request begin', [
                'error_id' => $errorId,
                'file_id' => $file->id,
                'disk' => $diskKey,
                'path' => $file->path,
                'mime' => $file->mime_type,
                'range' => request()->header('Range'),
                'user_id' => $user?->id,
            ]);

            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'preview',
                'target_type' => 'file',
                'target_id' => $file->id,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'success' => true,
                'details' => [
                    'file_name' => $file->name,
                    'mime_type' => $file->mime_type,
                    'error_id' => $errorId,
                ],
            ]);

            $filePath = Storage::disk($diskKey)->path($file->path);
            $fileSize = Storage::disk($diskKey)->size($file->path);
            $mimeType = $file->mime_type;

            $headers = [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $file->name . '"',
                'Cache-Control' => 'public, max-age=3600',
            ];

            $range = request()->header('Range');

            if ($range && Str::startsWith($mimeType, 'video/')) {
                list($start, $end) = $this->parseRangeHeader($range, $fileSize);

                if ($start !== null && $end !== null) {
                    $length = $end - $start + 1;

                    $headers['Content-Range'] = 'bytes ' . $start . '-' . $end . '/' . $fileSize;
                    $headers['Accept-Ranges'] = 'bytes';
                    $headers['Content-Length'] = $length;

                    return response()->stream(function () use ($filePath, $start, $length) {
                        $handle = fopen($filePath, 'rb');
                        fseek($handle, $start);
                        echo fread($handle, $length);
                        fclose($handle);
                    }, 206, $headers);
                }
            }


            return response()->file($filePath, $headers);

        } catch (\Exception $e) {
            $errorId = (string) ($errorId ?? \Illuminate\Support\Str::uuid());
            \Illuminate\Support\Facades\Log::error('Preview exception', [
                'error_id' => $errorId,
                'file_id' => $file->id,
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'preview',
                'target_type' => 'file',
                'target_id' => $file->id,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'success' => false,
                'details' => [
                    'file_name' => $file->name,
                    'error' => $e->getMessage(),
                    'error_id' => $errorId,
                ],
            ]);

            abort(500, 'Failed to load file preview: ' . $e->getMessage());
        }
    }

    /**
     * Parses the Range header and returns the start and end bytes.
     *
     * @param string $rangeHeader
     * @param int $fileSize
     * @return array|null
     */
    private function parseRangeHeader(string $rangeHeader, int $fileSize): ?array
    {
        $range = str_replace('bytes=', '', $rangeHeader);
        $parts = explode('-', $range);

        $start = (int) ($parts[0] ?? 0);
        $end = (int) ($parts[1] ?? $fileSize - 1);


        if ($start > $end || $start < 0 || $end >= $fileSize) {
            return null;
        }

        return [$start, $end];
    }

    public function restore(File $file): RedirectResponse
    {
        $this->authorize('restore', $file);

        $file->restore();

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'restore',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'file_name' => $file->name,
            ],
        ]);

        return redirect()->back()->with('success', 'File restored successfully.');
    }

    public function move(Request $request, File $file): RedirectResponse
    {
        $this->authorize('update', $file);

        $request->validate([
            'folder_id' => 'nullable|exists:folders,id',
        ]);


        if ($request->folder_id) {
            $folder = Folder::where('id', $request->folder_id)
                ->where(function ($q) {
                    $q->where('user_id', Auth::id())
                      ->orWhere('visibility', 'public');
                })
                ->first();

            if (!$folder) {
                return redirect()->back()->withErrors([
                    'folder_id' => 'Invalid folder selected.'
                ]);
            }
        }


        if ($file->folder_id == $request->folder_id) {
            return redirect()->back()->withErrors([
                'folder_id' => 'File is already in this folder.'
            ]);
        }

        $oldFolderId = $file->folder_id;
        $file->update([
            'folder_id' => $request->folder_id,
        ]);

        // Clear relevant caches after file move
        $this->clearFileCaches(Auth::id(), $oldFolderId);
        $this->clearFileCaches(Auth::id(), $request->folder_id);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'move',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'success' => true,
            'details' => [
                'file_name' => $file->name,
                'from_folder_id' => $oldFolderId,
                'to_folder_id' => $request->folder_id,
            ],
        ]);

        return redirect()->back()->with('success', 'File moved successfully.');
    }

    private function getBreadcrumbs(?Folder $folder): array
    {
        $breadcrumbs = [
            ['title' => 'File Saya', 'href' => route('files.index')],
        ];

        if ($folder) {
            $path = collect([$folder]);
            $parent = $folder->parent;

            while ($parent) {
                $path->prepend($parent);
                $parent = $parent->parent;
            }

            foreach ($path as $folderItem) {
                $token = Crypt::encryptString((string) $folderItem->id);
                $breadcrumbs[] = [
                    'title' => $folderItem->name,
                    'href' => route('folders.view', ['token' => $token]),
                ];
            }
        }

        return $breadcrumbs;
    }

    public function toggleStar(File $file): RedirectResponse
    {
        $this->authorize('view', $file);

        /** @var User $user */
        $user = Auth::user();
        $isStarred = $file->isStarredBy($user);

        if ($isStarred) {
            $user->starredFiles()->detach($file->id);
            $action = 'unstar';
        } else {
            $user->starredFiles()->attach($file->id);
            $action = 'star';
        }

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'file_name' => $file->name,
            ],
        ]);

        return redirect()->back();
    }

    public function batchUpdate(Request $request)
    {
        $updates = $request->input('updates', []);

        foreach ($updates as $updateData) {
            $file = File::find($updateData['file_id']);
            if (!$file) continue;

            $this->authorize('update', $file);

            $file->update([
                'name' => $updateData['name'],
                'description' => $updateData['description'],
                'tags' => $updateData['tags'] ? explode(',', $updateData['tags']) : null,
                'visibility' => $updateData['visibility'],
            ]);

            if ($updateData['visibility'] === 'shared' && isset($updateData['shared_with'])) {

                $file->shares()->delete();

                foreach ($updateData['shared_with'] as $userId) {
                    $file->shares()->create([
                        'shared_with' => $userId,
                        'permission' => 'view',
                        'shared_by' => Auth::id(),
                    ]);
                }
            } elseif ($updateData['visibility'] !== 'shared') {

                $file->shares()->delete();
            }


            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'edit',
                'target_type' => 'file',
                'target_id' => $file->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'success' => true,
                'details' => [
                    'file_name' => $file->name,
                    'visibility' => $updateData['visibility'],
                    'shared_with_count' => count($updateData['shared_with'] ?? [])
                ],
            ]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Batch delete files by ids. Each file is authorized before deletion.
     */
    public function batchDelete(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return redirect()->back()->with('success', 'File tidak ditemukan.');
        }

        $deleted = 0;
        $errors = [];

        foreach ($ids as $id) {
            try {
                $file = File::find($id);
                if (!$file) {
                    $errors[] = "File {$id} not found";
                    continue;
                }

                $this->authorize('delete', $file);

                // delete physical files and versions
                try {
                    if ($file->disk && $file->path) {
                        try { Storage::disk($file->disk)->delete($file->path); } catch (\Throwable $e) { /* ignore */ }
                    }
                    $file->versions()->get()->each(function ($version) use ($file) {
                        try { Storage::disk($file->disk)->delete($version->path); } catch (\Throwable $e) { /* ignore */ }
                    });
                } catch (\Throwable $e) {
                    // continue with DB delete even if physical deletion failed
                }

                $file->delete();
                $deleted++;
            } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
                $errors[] = "No permission to delete file {$id}";
            } catch (\Throwable $e) {
                $errors[] = "Failed to delete file {$id}: {$e->getMessage()}";
            }
        }

        // Clear relevant caches after batch deletion
        if ($deleted > 0) {
            $this->clearFileCaches(Auth::id());
        }

        // If there were no errors, return 204 No Content so the frontend
        // Inertia request doesn't receive a JSON body to render.
        if (empty($errors)) {
            return response()->noContent();
        }

        // If some files failed to delete, return 207 Multi-Status with details
        return redirect()->back()->with('success', 'File berhasil dihapus.');
    }

    /**
     * Batch move files to another folder. Each file is authorized before moving.
     */
    public function batchMove(Request $request)
    {
        $ids = $request->input('ids', []);
        $targetFolderId = $request->input('folder_id');

        if (!is_array($ids) || empty($ids)) {
            return redirect()->back()->with('success', 'File tidak ditemukan.');
        }

        $moved = 0;
        $errors = [];

        foreach ($ids as $id) {
            try {
                $file = File::find($id);
                if (!$file) {
                    $errors[] = "File {$id} not found";
                    continue;
                }

                $this->authorize('update', $file);

                $oldFolder = $file->folder_id;
                $file->update(['folder_id' => $targetFolderId]);

                ActivityLog::create([
                    'user_id' => Auth::id(),
                    'action' => 'move',
                    'target_type' => 'file',
                    'target_id' => $file->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'success' => true,
                    'details' => [
                        'file_name' => $file->name,
                        'from_folder' => $oldFolder,
                        'to_folder' => $targetFolderId,
                    ],
                ]);

                $moved++;
            } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
                $errors[] = "No permission to move file {$id}";
            } catch (\Throwable $e) {
                $errors[] = "Failed to move file {$id}: {$e->getMessage()}";
            }
        }

        // Clear relevant caches after batch move
        if ($moved > 0) {
            $this->clearFileCaches(Auth::id());
        }

        if (empty($errors)) {
            return response()->noContent();
        }

        return redirect()->back()->with('success', 'File berhasil dipindahkan');
    }

    /**
     * Recursively flatten files array to handle nested folder uploads
     */
    private function flattenFilesArray($filesArray, &$flattenedFiles)
    {
        foreach ($filesArray as $item) {
            if (is_array($item)) {

                $this->flattenFilesArray($item, $flattenedFiles);
            } elseif ($item instanceof \Illuminate\Http\UploadedFile) {

                $flattenedFiles[] = $item;
            }
        }
    }

    /**
     * Create folder hierarchy from relative paths and return folder ID mapping
     */
    private function createFolderHierarchy(array $relativePaths, int $parentFolderId = null, string $visibility = 'public'): array
    {
        $folderMap = [];
        $createdFolders = [];

        foreach ($relativePaths as $relativePath) {
            $pathParts = explode('/', $relativePath);
            $filename = array_pop($pathParts);

            if (empty($pathParts)) {
                continue;
            }

            $currentPath = '';
            $currentParentId = $parentFolderId;

            foreach ($pathParts as $folderName) {
                $currentPath = $currentPath ? $currentPath . '/' . $folderName : $folderName;


                if (!isset($folderMap[$currentPath])) {

                    $existingFolder = \App\Models\Folder::where('name', $folderName)
                        ->where('parent_id', $currentParentId)
                        ->where('user_id', Auth::id())
                        ->first();

                    if ($existingFolder) {
                        $folderMap[$currentPath] = $existingFolder->id;
                        $currentParentId = $existingFolder->id;
                    } else {

                        $folder = \App\Models\Folder::create([
                            'user_id' => Auth::id(),
                            'parent_id' => $currentParentId,
                            'name' => $folderName,
                            'visibility' => $visibility,
                        ]);

                        $folderMap[$currentPath] = $folder->id;
                        $currentParentId = $folder->id;
                        $createdFolders[] = $folder;

                        Log::info('Created folder', [
                            'folder_id' => $folder->id,
                            'name' => $folderName,
                            'parent_id' => $currentParentId,
                            'path' => $currentPath,
                        ]);
                    }
                } else {
                    $currentParentId = $folderMap[$currentPath];
                }
            }
        }

        return $folderMap;
    }

    private function clearFileCaches(int $userId, $folderId = null): void
    {
        // Clear various cache patterns
        $patterns = [
            "cloud_data_{$userId}_*",
            "folder_show_*_{$userId}",
            "folders_index_{$userId}_*",
        ];

        foreach ($patterns as $pattern) {
            Cache::forget($pattern);
        }

        // Clear specific caches
        if ($folderId) {
            Cache::forget("folder_show_{$folderId}_{$userId}");
            Cache::forget("folders_index_{$userId}_{$folderId}_*");
        }

        // Bump per-user folders version token so versioned cache keys are invalidated
        $versionKey = "folders_version_{$userId}";
        try {
            Cache::increment($versionKey);
        } catch (\Throwable $e) {
            $curr = Cache::get($versionKey, 0);
            Cache::put($versionKey, $curr + 1);
        }
    }
}


