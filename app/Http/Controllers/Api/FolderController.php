<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Folder;
use App\Models\File;
use App\Models\ActivityLog;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Zip;

class FolderController extends Controller
{
    public function index(Request $request)
    {
        $parentId = $request->get('parent_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $myFoldersOnly = $request->get('my_folders_only', false);

        $user = Auth::user();
        $query = Folder::with(['user', 'parent']);

        // If my_folders_only is true, only show user's own folders (even for super-admin)
        if ($myFoldersOnly) {
            $query->where('user_id', $user->id);
        } elseif (!$user->isSuperAdmin()) {
            // Super-admin can see all folders, others are restricted
            $query->where('user_id', $user->id);
        }

        if ($parentId) {
            $query->where('parent_id', $parentId);
        } else {
            $query->whereNull('parent_id');
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $folders = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        $user = Auth::user();
        $folders->getCollection()->transform(function ($folder) use ($user) {
            $filesQuery = File::where('folder_id', $folder->id)
                ->whereHas('storageLocation', function ($q) {
                    $q->where('is_active', true);
                });

            // Super-admin can see all files, others only their own
            if (!$user->isSuperAdmin()) {
                $filesQuery->where('user_id', $user->id);
            }

            $filesCount = $filesQuery->count();

            $sizeQuery = File::where('folder_id', $folder->id)
                ->whereHas('storageLocation', function ($q) {
                    $q->where('is_active', true);
                });

            if (!$user->isSuperAdmin()) {
                $sizeQuery->where('user_id', $user->id);
            }

            $totalSize = $sizeQuery->sum('size');

            $folder->files_count = $filesCount;
            $folder->total_size = $totalSize;
            return $folder;
        });

        return response()->json([
            'status' => 'success',
            'data' => $folders->items(),
            'meta' => [
                'current_page' => $folders->currentPage(),
                'last_page' => $folders->lastPage(),
                'per_page' => $folders->perPage(),
                'total' => $folders->total(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:folders,id',
            'visibility' => 'nullable|in:private,shared,public',
        ]);

        $existingFolder = Folder::where('user_id', Auth::id())
            ->where('parent_id', $request->parent_id)
            ->where('name', $request->name)
            ->first();

        if ($existingFolder) {
            return response()->json([
                'status' => 'error',
                'message' => 'A folder with this name already exists in this location.',
            ], 400);
        }

        $folder = Folder::create([
            'user_id' => Auth::id(),
            'parent_id' => $request->parent_id,
            'name' => $request->name,
            'visibility' => $request->input('visibility', 'private'),
        ]);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'create_folder',
            'target_type' => 'folder',
            'target_id' => $folder->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'success' => true,
            'details' => [
                'folder_name' => $folder->name,
                'parent_id' => $folder->parent_id,
            ],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Folder created successfully',
            'data' => $folder,
        ], 201);
    }

    public function show(Folder $folder)
    {
        $this->authorize('view', $folder);

        $user = Auth::user();

        $files = File::with(['user', 'storageLocation'])
            ->where('folder_id', $folder->id)
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
            ->where(function ($q) use ($user) {
                if ($user->isStaff() && !$user->isAdmin()) {
                    $q->where('user_id', $user->id);
                } else {
                    $q->where('user_id', $user->id)
                      ->orWhere('visibility', 'public')
                      ->orWhereHas('shares', function ($shareQuery) use ($user) {
                          $shareQuery->where('shared_with', $user->id)
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                }
            })
            ->orderBy('updated_at', 'desc')
            ->get();

        $files->transform(function ($file) use ($user) {
            $file->starred = $file->isStarredBy($user);
            return $file;
        });

        $subfolders = Folder::with(['user'])
            ->where('parent_id', $folder->id)
            ->where(function ($q) use ($user) {
                if ($user->isStaff() && !$user->isAdmin()) {
                    $q->where('user_id', $user->id);
                } else {
                    $q->where('user_id', $user->id)
                      ->orWhere('visibility', 'public')
                      ->orWhereHas('shares', function ($shareQuery) use ($user) {
                          $shareQuery->where('shared_with', $user->id)
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                }
            })
            ->orderBy('name')
            ->get();

        // Transform files
        $filesData = $files->map(function ($file) {
            return [
                'id' => $file->id,
                'name' => $file->name,
                'size' => $file->size,
                'mime_type' => $file->mime_type,
                'description' => $file->description,
                'tags' => $file->tags,
                'visibility' => $file->visibility,
                'starred' => $file->starred ?? false,
                'folder_id' => $file->folder_id,
                'created_at' => $file->created_at->toISOString(),
                'updated_at' => $file->updated_at->toISOString(),
                'user' => [
                    'id' => $file->user->id,
                    'name' => $file->user->name,
                    'email' => $file->user->email,
                ],
                'storage_location' => $file->storageLocation ? [
                    'id' => $file->storageLocation->id,
                    'name' => $file->storageLocation->name,
                ] : null,
            ];
        });

        // Transform subfolders
        $subfoldersData = $subfolders->map(function ($subfolder) {
            $filesCount = File::where('folder_id', $subfolder->id)
                ->whereHas('storageLocation', function ($q) {
                    $q->where('is_active', true);
                })
                ->count();

            return [
                'id' => $subfolder->id,
                'name' => $subfolder->name,
                'parent_id' => $subfolder->parent_id,
                'visibility' => $subfolder->visibility,
                'created_at' => $subfolder->created_at->toISOString(),
                'updated_at' => $subfolder->updated_at->toISOString(),
                'user' => [
                    'id' => $subfolder->user->id,
                    'name' => $subfolder->user->name,
                    'email' => $subfolder->user->email,
                ],
                'files_count' => $filesCount,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'folder' => [
                    'id' => $folder->id,
                    'name' => $folder->name,
                    'parent_id' => $folder->parent_id,
                    'visibility' => $folder->visibility,
                    'created_at' => $folder->created_at->toISOString(),
                    'updated_at' => $folder->updated_at->toISOString(),
                    'user' => [
                        'id' => $folder->user->id,
                        'name' => $folder->user->name,
                        'email' => $folder->user->email,
                    ],
                ],
                'files' => $filesData,
                'subfolders' => $subfoldersData,
            ],
        ]);
    }

    public function update(Request $request, Folder $folder)
    {
        $this->authorize('update', $folder);

        $request->validate([
            'name' => 'required|string|max:255',
            'visibility' => 'nullable|in:private,shared,public',
            'parent_id' => 'nullable|exists:folders,id',
        ]);

        $folder->update([
            'name' => $request->name,
            'visibility' => $request->input('visibility', $folder->visibility),
            'parent_id' => $request->input('parent_id', $folder->parent_id),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Folder updated successfully',
            'data' => $folder,
        ]);
    }

    public function destroy(Folder $folder)
    {
        $this->authorize('delete', $folder);
        $folder->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Folder deleted successfully',
        ]);
    }

    public function download(Folder $folder)
    {
        $this->authorize('view', $folder);

        $files = $this->getAllFilesInFolder($folder);

        if ($files->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Folder is empty.',
            ], 400);
        }

        $zipFileName = 'folder_' . $folder->name . '_' . time() . '.zip';
        $zipPath = storage_path('app/temp/' . $zipFileName);

        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE) !== TRUE) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot create ZIP file.',
            ], 500);
        }

        foreach ($files as $file) {
            $diskKey = $file->storageLocation->diskKey();
            if (Storage::disk($diskKey)->exists($file->path)) {
                $fileContent = Storage::disk($diskKey)->get($file->path);
                $zip->addFromString($file->name, $fileContent);
            }
        }

        $zip->close();

        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }

    public function restore(Folder $folder)
    {
        $this->authorize('restore', $folder);
        $folder->restore();

        return response()->json([
            'status' => 'success',
            'message' => 'Folder restored successfully',
        ]);
    }

    private function getAllFilesInFolder(Folder $folder)
    {
        $files = File::where('folder_id', $folder->id)
            ->where('user_id', Auth::id())
            ->with('storageLocation')
            ->get();

        $subfolders = Folder::where('parent_id', $folder->id)
            ->where('user_id', Auth::id())
            ->get();

        foreach ($subfolders as $subfolder) {
            $files = $files->merge($this->getAllFilesInFolder($subfolder));
        }

        return $files;
    }
}

