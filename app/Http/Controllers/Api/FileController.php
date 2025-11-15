<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\Folder;
use App\Models\FileVersion;
use App\Models\ActivityLog;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $folderId = $request->get('folder_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $myFilesOnly = $request->get('my_files_only', false);

        $query = File::with(['user', 'folder', 'storageLocation'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            });

        // Super-admin can see all files, others are restricted
        if (!$user->isSuperAdmin()) {
            if ($user->isStaff() && !$user->isAdmin()) {
                $query->where('user_id', $user->id);
            } else {
                // If my_files_only is true, only show user's own files
                if ($myFilesOnly) {
                    $query->where('user_id', $user->id);
                } else {
                    // Admin and regular users can see their own files, public files, shared files, and files shared with them
                    $query->where(function ($q) use ($user) {
                        $q->where('user_id', $user->id)
                          ->orWhere('visibility', 'public')
                          ->orWhere('visibility', 'shared')
                          ->orWhereHas('shares', function ($shareQuery) use ($user) {
                              $shareQuery->where('shared_with', $user->id)
                                         ->where(function ($expireQuery) {
                                             $expireQuery->whereNull('expires_at')
                                                        ->orWhere('expires_at', '>', now());
                                         });
                          });
                    });
                }
            }
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

        return response()->json([
            'status' => 'success',
            'data' => $files->items(),
            'meta' => [
                'current_page' => $files->currentPage(),
                'last_page' => $files->lastPage(),
                'per_page' => $files->perPage(),
                'total' => $files->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $uploadConfig = config('upload', []);

        $validationRules = [
            'files' => 'required|array|min:1',
            'files.*' => 'file',
            'folder_id' => 'nullable|exists:folders,id',
            'disk_id' => 'required|integer|exists:storage_locations,id',
            'description' => 'nullable|string|max:1000',
            'tags' => 'nullable|string',
            'visibility' => 'required|in:private,shared,public',
        ];

        $staffAllowedMimeTypes = [
            'image/*',
            'video/*',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ];

        if ($user->isAdmin()) {
            // Admins can upload any file type
        } elseif ($user->isStaff()) {
            $validationRules['files.*'] .= '|mimetypes:' . implode(',', $staffAllowedMimeTypes);
            $validationRules['visibility'] = 'required|in:public';
        } elseif (!empty($uploadConfig['allowed_mime_types'])) {
            $validationRules['files.*'] .= '|mimetypes:' . implode(',', $uploadConfig['allowed_mime_types']);
        }

        $validated = $request->validate($validationRules);

        $storageLocation = StorageLocation::active()->where('id', $validated['disk_id'])->first();
        if (!$storageLocation || !(bool) ($storageLocation->can_serve ?? false)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Lokasi penyimpanan tidak tersedia untuk upload.',
            ], 400);
        }

        $storageDisk = $storageLocation->diskKey();
        $uploadedFiles = [];
        $storagePath = $uploadConfig['storage_path'] ?? 'files';

        foreach ($request->file('files') as $uploadedFile) {
            try {
                $path = $uploadedFile->store($storagePath, $storageDisk);
                if ($path === false) {
                    continue;
                }

                $checksum = hash_file('sha256', $uploadedFile->getRealPath());

                $file = File::create([
                    'user_id' => Auth::id(),
                    'folder_id' => $request->folder_id,
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
            } catch (\Exception $e) {
                continue;
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => count($uploadedFiles) . ' file berhasil diunggah.',
            'data' => $uploadedFiles,
        ], 201);
    }

    public function show(File $file)
    {
        $this->authorize('view', $file);

        $file->load(['user', 'folder', 'versions.uploadedBy', 'shares.sharedWith', 'shares.sharedBy']);

        return response()->json([
            'status' => 'success',
            'data' => $file,
        ]);
    }

    public function update(Request $request, File $file)
    {
        $this->authorize('update', $file);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'tags' => 'nullable|string',
            'visibility' => 'required|in:private,shared,public',
        ]);

        $file->update([
            'name' => $request->name,
            'description' => $request->description,
            'tags' => $request->tags ? explode(',', $request->tags) : null,
            'visibility' => $request->visibility,
        ]);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'edit',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'success' => true,
            'details' => ['file_name' => $file->name],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'File updated successfully',
            'data' => $file,
        ]);
    }

    public function destroy(File $file)
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

        return response()->json([
            'status' => 'success',
            'message' => 'File deleted successfully',
        ]);
    }

    public function download(File $file)
    {
        $this->authorize('download', $file);

        if (!$file->storageLocation || !$file->storageLocation->is_active) {
            return response()->json(['status' => 'error', 'message' => 'File not found'], 404);
        }

        $diskKey = $file->storageLocation->diskKey();
        if (!Storage::disk($diskKey)->exists($file->path)) {
            return response()->json(['status' => 'error', 'message' => 'File not found'], 404);
        }

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

        return response()->download(Storage::disk($diskKey)->path($file->path), $file->name);
    }

    public function preview(File $file)
    {
        $this->authorize('view', $file);

        if (!$file->storageLocation || !$file->storageLocation->is_active) {
            return response()->json(['status' => 'error', 'message' => 'File not found'], 404);
        }

        $diskKey = $file->storageLocation->diskKey();
        if (!Storage::disk($diskKey)->exists($file->path)) {
            return response()->json(['status' => 'error', 'message' => 'File not found'], 404);
        }

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
            ],
        ]);

        $filePath = Storage::disk($diskKey)->path($file->path);
        $mimeType = $file->mime_type;

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . $file->name . '"',
        ];

        return response()->file($filePath, $headers);
    }

    public function restore(File $file)
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
            'details' => ['file_name' => $file->name],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'File restored successfully',
        ]);
    }

    public function move(Request $request, File $file)
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
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid folder selected.',
                ], 400);
            }
        }

        if ($file->folder_id == $request->folder_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'File is already in this folder.',
            ], 400);
        }

        $file->update(['folder_id' => $request->folder_id]);

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
                'to_folder_id' => $request->folder_id,
            ],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'File moved successfully',
        ]);
    }

    public function toggleStar(File $file)
    {
        $user = Auth::user();
        $isStarred = $file->isStarredBy($user);

        if ($isStarred) {
            $file->starredBy()->detach($user->id);
        } else {
            $file->starredBy()->attach($user->id);
        }

        return response()->json([
            'status' => 'success',
            'message' => $isStarred ? 'File unstarred' : 'File starred',
            'starred' => !$isStarred,
        ]);
    }

    public function batchUpdate(Request $request)
    {
        $request->validate([
            'file_ids' => 'required|array',
            'file_ids.*' => 'exists:files,id',
            'action' => 'required|in:delete,move,star,unstar',
            'folder_id' => 'required_if:action,move|exists:folders,id',
        ]);

        $files = File::whereIn('id', $request->file_ids)
            ->where('user_id', Auth::id())
            ->get();

        foreach ($files as $file) {
            $this->authorize('update', $file);

            switch ($request->action) {
                case 'delete':
                    $file->delete();
                    break;
                case 'move':
                    $file->update(['folder_id' => $request->folder_id]);
                    break;
                case 'star':
                    $file->starredBy()->syncWithoutDetaching([Auth::id()]);
                    break;
                case 'unstar':
                    $file->starredBy()->detach(Auth::id());
                    break;
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Files updated successfully',
        ]);
    }

    public function versions(File $file)
    {
        $this->authorize('view', $file);

        $versions = FileVersion::where('file_id', $file->id)
            ->with('uploadedBy')
            ->orderBy('version_number', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $versions,
        ]);
    }

    public function storeVersion(Request $request, File $file)
    {
        $this->authorize('update', $file);

        $request->validate([
            'file' => 'required|file',
        ]);

        $storageLocation = $file->storageLocation;
        if (!$storageLocation || !$storageLocation->is_active || !(bool) ($storageLocation->can_serve ?? false)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Storage location not available.',
            ], 400);
        }

        $uploadedFile = $request->file('file');
        $nextVersion = FileVersion::where('file_id', $file->id)->max('version_number') + 1;
        $path = $uploadedFile->store('files/versions', $storageLocation->diskKey());
        $checksum = hash_file('sha256', $uploadedFile->getRealPath());

        $version = FileVersion::create([
            'file_id' => $file->id,
            'version_number' => $nextVersion,
            'path' => $path,
            'size' => $uploadedFile->getSize(),
            'mime_type' => $uploadedFile->getMimeType(),
            'checksum' => $checksum,
            'uploaded_by' => Auth::id(),
        ]);

        $file->update([
            'path' => $path,
            'size' => $uploadedFile->getSize(),
            'mime_type' => $uploadedFile->getMimeType(),
            'checksum' => $checksum,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Version {$nextVersion} uploaded successfully",
            'data' => $version,
        ], 201);
    }

    public function restoreVersion(File $file, FileVersion $version)
    {
        $this->authorize('update', $file);

        $file->update([
            'path' => $version->path,
            'size' => $version->size,
            'mime_type' => $version->mime_type,
            'checksum' => $version->checksum,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "File restored to version {$version->version_number}",
        ]);
    }

    public function downloadVersion(File $file, FileVersion $version)
    {
        $this->authorize('download', $file);

        $diskKey = $file->storageLocation->diskKey();
        if (!Storage::disk($diskKey)->exists($version->path)) {
            return response()->json(['status' => 'error', 'message' => 'Version not found'], 404);
        }

        return Storage::disk($diskKey)->download($version->path, "{$file->name} (v{$version->version_number})");
    }

    public function destroyVersion(File $file, FileVersion $version)
    {
        $this->authorize('delete', $file);

        $versionCount = FileVersion::where('file_id', $file->id)->count();
        if ($versionCount <= 1) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot delete the only version.',
            ], 400);
        }

        $diskKey = $file->storageLocation->diskKey();
        Storage::disk($diskKey)->delete($version->path);
        $version->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Version deleted successfully',
        ]);
    }
}

