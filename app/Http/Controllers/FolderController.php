<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use App\Models\ActivityLog;
use App\Models\File;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\StorageLocation;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Zip;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FolderController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $parentId = $request->get('parent_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        // Cache key for folder listing
        $cacheKey = "folders_index_{$user->id}_{$parentId}_{$search}_{$sortBy}_{$sortOrder}";

        $data = Cache::remember($cacheKey, 300, function () use ($user, $parentId, $search, $sortBy, $sortOrder) {
            return $this->getFolderIndexData($user, $parentId, $search, $sortBy, $sortOrder);
        });

        return Inertia::render('Folders/Index', $data);
    }

    private function getFolderIndexData(User $user, $parentId, $search, $sortBy, $sortOrder): array
    {
        $query = Folder::with(['user:id,name', 'parent:id,name'])
            ->where('user_id', $user->id)
            ->select(['id', 'name', 'parent_id', 'user_id', 'updated_at', 'created_at']);

        if ($parentId) {
            $query->where('parent_id', $parentId);
        } else {
            $query->whereNull('parent_id');
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $folders = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        // Optimize file count and size calculations using single queries
        $folderIds = $folders->pluck('id')->toArray();

        if (!empty($folderIds)) {
            // Get file counts and sizes in batch using Eloquent
            $fileStats = File::whereIn('folder_id', $folderIds)
                ->whereHas('storageLocation', function ($q) {
                    $q->where('is_active', true);
                })
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('visibility', 'public');
                })
                ->select('folder_id',
                    DB::raw('COUNT(*) as files_count'),
                    DB::raw('SUM(size) as total_size')
                )
                ->groupBy('folder_id')
                ->get()
                ->keyBy('folder_id');

            $folders->getCollection()->transform(function ($folder) use ($fileStats) {
                $stats = $fileStats->get($folder->id);
                $folder->files_count = $stats ? $stats->files_count : 0;
                $folder->total_size = $stats ? $stats->total_size : 0;
                return $folder;
            });
        }

        $users = Cache::remember("users_for_sharing_{$user->id}", 600, function () use ($user) {
            return User::where('id', '!=', $user->id)
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get();
        });

        $currentFolder = $parentId ? Folder::find($parentId) : null;
        $breadcrumbs = $this->getBreadcrumbs($currentFolder);

        $availableDisks = collect(config('filesystems.disks', []))
            ->map(function ($config, $key) {
                return [
                    'key' => $key,
                    'label' => ucfirst($key),
                ];
            })
            ->values();

        $activeServingLocations = StorageLocation::serving()
            ->orderBy('name')
            ->get(['id', 'name']);

        return [
            'folders' => $folders,
            'storageLoc' => $activeServingLocations->map(function ($loc) {
                return ['id' => $loc->id, 'name' => $loc->name];
            }),
            'currentFolder' => $currentFolder,
            'breadcrumbs' => $breadcrumbs,
            'users' => $users,
            'disks' => $availableDisks,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ];
    }

    public function store(Request $request): RedirectResponse
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
            return redirect()->back()->withErrors([
                'name' => 'Folder dengan nama yang sama sudah ada di lokasi ini.'
            ]);
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

        // Clear relevant caches
        $this->clearFolderCaches(Auth::id(), $request->parent_id);

        return redirect()->back()->with('success', 'Folder berhasil dibuat.');
    }

    public function show(Request $request, Folder $folder)
    {
        $user = Auth::user();
        /** @var User $user */
        $this->authorize('view', $folder);

        // Cache key for folder show
        $cacheKey = "folder_show_{$folder->id}_{$user->id}";

        $data = Cache::remember($cacheKey, 180, function () use ($folder, $user) {
            return $this->getFolderShowData($folder, $user);
        });

        return inertia('Folders/Show', array_merge($data, [
            'from' => $request->query('from'),
        ]));
    }

    private function getFolderShowData(Folder $folder, User $user): array
    {
        // Optimized files query with proper eager loading
        $files = File::with(['user:id,name', 'storageLocation:id,name,is_active'])
            ->where('folder_id', $folder->id)
            ->visibleTo($user)
            ->whereHas('storageLocation', fn($q) => $q->where('is_active', true))
            ->latest('updated_at')
            ->select(['id', 'name', 'size', 'mime_type', 'created_at', 'updated_at', 'folder_id', 'user_id', 'description', 'tags', 'visibility'])
            ->get()
            ->map->toFrontend();

        // Optimized subfolders query
        $subfolders = Folder::where('parent_id', $folder->id)
            ->visibleTo($user)
            ->withCount(['files', 'children as folders_count'])
            ->orderBy('name')
            ->select(['id', 'name', 'parent_id', 'created_at', 'updated_at', 'visibility'])
            ->get()
            ->map(fn($subfolder) => [
                'id' => $subfolder->id,
                'name' => $subfolder->name,
                'parent_id' => $subfolder->parent_id,
                'created_at' => $subfolder->created_at->toISOString(),
                'updated_at' => $subfolder->updated_at->toISOString(),
                'files_count' => $subfolder->files_count,
                'folders_count' => $subfolder->folders_count,
            ]);

        $breadcrumbs = $this->getBreadcrumbs($folder);

        // Optimized all folders query
        $allFolders = Folder::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('visibility', 'public');
            })
            ->orderBy('name')
            ->select(['id', 'name', 'parent_id'])
            ->get()
            ->map(function ($folder) {
                return [
                    'id' => $folder->id,
                    'name' => $folder->name,
                    'parent_id' => $folder->parent_id,
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

        $activeServingLocations = StorageLocation::serving()
            ->orderBy('name')
            ->get(['id', 'name']);

        return [
            'folder' => [
                'id' => $folder->id,
                'name' => $folder->name,
                'parent_id' => $folder->parent_id,
                'created_at' => $folder->created_at->toISOString(),
                'updated_at' => $folder->updated_at->toISOString(),
                'files_count' => $files->count(),
                'folders_count' => $subfolders->count(),
            ],
            'files' => $files,
            'folders' => $subfolders,
            'breadcrumbs' => $breadcrumbs,
            'currentFolderId' => $folder->id,
            'allFolders' => $allFolders,
            'disks' => $availableDisks,
            'storageLoc' => $activeServingLocations->map(function ($loc) {
                return ['id' => $loc->id, 'name' => $loc->name];
            }),
        ];
    }

    /**
     * View a folder using an encrypted token and redirect to files listing.
     */
    public function view(string $token): RedirectResponse
    {
        $folderId = (int) Crypt::decryptString($token);
        $folder = Folder::findOrFail($folderId);
        $this->authorize('view', $folder);

        return redirect()->route('files.index', ['folder_id' => $folder->id]);
    }

    public function download(Folder $folder)
    {
        $this->authorize('view', $folder);


        $files = $this->getAllFilesInFolder($folder);

        if ($files->isEmpty()) {
            return redirect()->back()->with('error', 'Folder kosong.');
        }


        $zipFileName = 'folder_' . $folder->name . '_' . time() . '.zip';
        $zipPath = storage_path('app/temp/' . $zipFileName);


        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }


        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE) !== TRUE) {
            return redirect()->back()->with('error', 'Tidak dapat membuat file ZIP.');
        }

        foreach ($files as $file) {

            $storageLocation = $file->storageLocation;
            if (!$storageLocation || !$storageLocation->is_active) {
                continue;
            }
            $diskKey = method_exists($storageLocation, 'diskKey') ? $storageLocation->diskKey() : $storageLocation->disk;
            if ($diskKey && Storage::disk($diskKey)->exists($file->path)) {
                $fileContent = Storage::disk($diskKey)->get($file->path);
                $zip->addFromString($file->name, $fileContent);
            }
        }

        $zip->close();


        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'download',
            'target_type' => 'folder',
            'target_id' => $folder->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'folder_name' => $folder->name,
                'files_count' => $files->count(),
            ],
        ]);


        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }

    private function getAllFilesInFolder(Folder $folder)
    {
        $files = collect();


        $directFiles = File::where('folder_id', $folder->id)
            ->where(function ($q) {
                $q->where('user_id', Auth::id())
                  ->orWhere('visibility', 'public');
            })
            ->get();
        $files = $files->merge($directFiles);


        $subfolders = Folder::where('parent_id', $folder->id)
            ->where(function ($q) {
                $q->where('user_id', Auth::id())
                  ->orWhere('visibility', 'public');
            })
            ->get();

        foreach ($subfolders as $subfolder) {
            $files = $files->merge($this->getAllFilesInFolder($subfolder));
        }

        return $files;
    }

    public function update(Request $request, Folder $folder): RedirectResponse
    {
        try {
            $this->authorize('update', $folder);

            $request->validate([
                'name' => 'required|string|max:255',
                'visibility' => 'required|in:private,shared,public',
                'shared_with' => 'nullable|array',
                'shared_with.*' => 'integer|exists:users,id',
            ]);


            $existingFolder = Folder::where('user_id', $folder->user_id)
                ->where('parent_id', $folder->parent_id)
                ->where('name', $request->name)
                ->where('id', '!=', $folder->id)
                ->first();

            if ($existingFolder) {
                return redirect()->back()->withErrors([
                    'name' => 'Folder dengan nama yang sama sudah ada di lokasi ini.'
                ]);
            }

            $oldData = [
                'name' => $folder->name,
                'visibility' => $folder->visibility,
            ];

            $folder->update([
                'name' => $request->name,
                'visibility' => $request->visibility,
            ]);


            if ($request->visibility === 'shared' && $request->has('shared_with')) {

                $folder->shares()->delete();


                foreach ($request->shared_with as $userId) {
                    $folder->shares()->create([
                        'shared_with' => $userId,
                        'permission' => 'view',
                        'shared_by' => Auth::id(),
                    ]);
                }
            } elseif ($request->visibility !== 'shared') {

                $folder->shares()->delete();
            }


            ActivityLog::create([
                'user_id' => Auth::id(),
                'action' => 'edit',
                'target_type' => 'folder',
                'target_id' => $folder->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'success' => true,
                'details' => [
                    'folder_name' => $folder->name,
                    'changes' => array_diff_assoc([
                        'name' => $folder->name,
                        'visibility' => $folder->visibility,
                    ], $oldData),
                ],
            ]);

            return redirect()->back()->with('success', 'Folder updated successfully.');
        } catch (\Exception $e) {
            Log::error('Folder update failed: ' . $e->getMessage(), [
                'folder_id' => $folder->id,
                'user_id' => Auth::id(),
                'request_data' => $request->all(),
                'exception' => $e,
            ]);
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan, tolong hubungi developer.']);
        }
    }

    public function destroy(Folder $folder): RedirectResponse
    {
        $this->authorize('delete', $folder);


       if ($folder->children()->count() > 0 || $folder->files()->count() > 0) {
    return redirect()->back()->withErrors([
        'folder' => 'Tidak bisa menghapus folder ' . $folder->name . ' karena masih memiliki file/folder di dalamnya. Mohon kosongkan folder ' . $folder->name . ' terlebih dahulu.'
    ]);
}


        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'delete',
            'target_type' => 'folder',
            'target_id' => $folder->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'folder_name' => $folder->name,
            ],
        ]);

        $folder->delete();

        // Clear relevant caches after folder deletion
        $this->clearFolderCaches(Auth::id(), $folder->parent_id);

        return redirect()->back()->with('success', 'Folder berhasil dihapus.');
    }

    public function restore(Folder $folder): RedirectResponse
    {
        $this->authorize('restore', $folder);

        $folder->restore();

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'restore',
            'target_type' => 'folder',
            'target_id' => $folder->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'folder_name' => $folder->name,
            ],
        ]);

        return redirect()->back()->with('success', 'Folder berhasil dipulihkan.');
    }

    private function getBreadcrumbs(?Folder $folder): array
    {
        $breadcrumbs = [
            ['id' => 0, 'name' => 'Semua Folder', 'link' => route('folders.index')],
        ];

        if ($folder) {
            $path = collect([$folder]);
            $parent = $folder->parent;

            while ($parent) {
                $path->prepend($parent);
                $parent = $parent->parent;
            }

            foreach ($path as $folderItem) {
                $breadcrumbs[] = [
                    'id' => $folderItem->id,
                    'name' => $folderItem->name,
                    'link' => route('folders.show', ['folder' => $folderItem->id]),
                ];
            }
        }

        return $breadcrumbs;
    }

    private function clearFolderCaches(int $userId, $parentId = null): void
    {
        $patterns = [
            "folders_index_{$userId}_*",
            "folder_show_*_{$userId}",
            "cloud_data_{$userId}_*",
        ];

        foreach ($patterns as $pattern) {
            Cache::forget($pattern);
        }

        // Clear specific caches
        if ($parentId) {
            Cache::forget("folders_index_{$userId}_{$parentId}_*");
        }
    }
private function formatFileSize($bytes)
{
    if ($bytes === 0) return '0 Bytes';
    $k = 1024;
    $sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    $i = floor(log($bytes) / log($k));
    return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
}

public function emptyFolder(Folder $folder): RedirectResponse
{
    $this->authorize('update', $folder);

    try {
        $this->deleteFolderContents($folder);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'empty',
            'target_type' => 'folder',
            'target_id' => $folder->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'folder_name' => $folder->name,
            ],
        ]);

        return redirect()->back()->with('success', 'Folder berhasil dikosongkan.');
    } catch (\Exception $e) {
        Log::error('Gagal mengkosongkan folder: ' . $e->getMessage(), [
            'folder_id' => $folder->id,
            'user_id' => Auth::id(),
            'exception' => $e,
        ]);
        return redirect()->back();
    }
}

private function deleteFolderContents(Folder $folder): void
{
    // Delete all files in the current folder
    foreach ($folder->files as $file) {
        $storageLocation = $file->storageLocation;
        if ($storageLocation && $storageLocation->is_active) {
            $diskKey = method_exists($storageLocation, 'diskKey') ? $storageLocation->diskKey() : $storageLocation->disk;
            if ($diskKey && Storage::disk($diskKey)->exists($file->path)) {
                Storage::disk($diskKey)->delete($file->path);
            }
        }
        $file->delete();
    }

    // Recursively delete all subfolders and their contents
    foreach ($folder->children as $subfolder) {
        $this->deleteFolderContents($subfolder);
        $subfolder->delete();
    }
}
}
