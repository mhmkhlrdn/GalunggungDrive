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
use Inertia\Inertia;
use Inertia\Response;

class FolderController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $activeServingLocations = StorageLocation::serving()->orderBy('name')->get(['id', 'name']);
        $parentId = $request->get('parent_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $query = Folder::with(['user', 'parent'])
            ->where(function ($q) {
                $q->where('user_id', Auth::id());

            });

        if ($parentId) {
            $query->where('parent_id', $parentId);
        } else {
            $query->whereNull('parent_id');
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $folders = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        
        $folders->getCollection()->transform(function ($folder) {
            $filesCount = File::where('folder_id', $folder->id)
                ->whereHas('storageLocation', function ($q) {
                    $q->where('is_active', true);
                })
                ->where(function ($q) {
                    $q->where('user_id', Auth::id())
                      ->orWhere('visibility', 'public');
                })
                ->count();

            $totalSize = File::where('folder_id', $folder->id)
                ->whereHas('storageLocation', function ($q) {
                    $q->where('is_active', true);
                })
                ->where(function ($q) {
                    $q->where('user_id', Auth::id())
                      ->orWhere('visibility', 'public');
                })
                ->sum('size');

            $folder->files_count = $filesCount;
            $folder->total_size = $totalSize;

            return $folder;
        });

        
        $users = User::where('id', '!=', Auth::id())
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

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

        return Inertia::render('Folders/Index', [
            'folders' => $folders,
            'storageLoc' => $activeServingLocations->map(function ($loc) { return ['id' => $loc->id, 'name' => $loc->name]; }),
            'currentFolder' => $currentFolder,
            'breadcrumbs' => $breadcrumbs,
            'users' => $users,
            'disks' => $availableDisks,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
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
                'name' => 'A folder with this name already exists in this location.'
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

        return redirect()->back()->with('success', 'Folder created successfully.');
    }

    public function show(Request $request, Folder $folder)
    {
        $user = Auth::user();
        /** @var User $user */
        $this->authorize('view', $folder);

        $files = File::where('folder_id', $folder->id)
            ->where(function ($q) use ($user){
                if ($user->isSuperAdmin()) {
                    
                } elseif ($user->isAdmin()) {
                    
                    $q->where('user_id', Auth::id())
                      ->orWhere('visibility', 'public')
                      ->orWhere('visibility', 'shared')
                      ->orWhereHas('shares', function ($shareQuery) {
                          $shareQuery->where('shared_with', Auth::id())
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                } elseif ((Auth::user()->role ?? null) === 'staff') {
                    
                    $q->where('user_id', Auth::id());
                } else {
                    
                    $q->where('user_id', Auth::id())
                      ->orWhere('visibility', 'public')
                      ->orWhere('visibility', 'shared')
                      ->orWhereHas('shares', function ($shareQuery) {
                          $shareQuery->where('shared_with', Auth::id())
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                }
                
                
            })
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'size' => $file->size,
                    'mime_type' => $file->mime_type,
                    'created_at' => $file->created_at->toISOString(),
                    'updated_at' => $file->updated_at->toISOString(),
                    'folder_id' => $file->folder_id,
                    'starred' => $file->isStarredBy(Auth::user()),
                    'description' => $file->description,
                    'tags' => $file->tags ?? [],
                ];
            });

        
        $subfolders = Folder::where('parent_id', $folder->id)
            ->where(function ($q) {
                $q->where('user_id', Auth::id())
                  ->orWhere('visibility', 'public');
            })
            ->orderBy('name')
            ->get()
            ->map(function ($subfolder) {
                $filesCount = File::where('folder_id', $subfolder->id)
                    ->where(function ($q) {
                        $q->where('user_id', Auth::id())
                          ->orWhere('visibility', 'public');
                    })
                    ->count();
                $foldersCount = Folder::where('parent_id', $subfolder->id)->count();

                return [
                    'id' => $subfolder->id,
                    'name' => $subfolder->name,
                    'parent_id' => $subfolder->parent_id,
                    'created_at' => $subfolder->created_at->toISOString(),
                    'updated_at' => $subfolder->updated_at->toISOString(),
                    'files_count' => $filesCount,
                    'folders_count' => $foldersCount,
                ];
            });

        
        $breadcrumbs = $this->getBreadcrumbs($folder);

        $allFolders = Folder::where(function ($q) {
                $q->where('user_id', Auth::id())
                  ->orWhere('visibility', 'public');
            })
            ->orderBy('name')
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

        return inertia('Folders/Show', [
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
            'storageLoc' => $activeServingLocations->map(function ($loc) { return ['id' => $loc->id, 'name' => $loc->name]; }),
            'from' => $request->query('from'),
        ]);
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
            return redirect()->back()->with('error', 'Folder is empty.');
        }

        
        $zipFileName = 'folder_' . $folder->name . '_' . time() . '.zip';
        $zipPath = storage_path('app/temp/' . $zipFileName);

        
        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        
        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE) !== TRUE) {
            return redirect()->back()->with('error', 'Cannot create ZIP file.');
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
                    'name' => 'A folder with this name already exists in this location.'
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
            return redirect()->back()->withErrors(['error' => 'An unexpected error occurred while updating the folder. Please check the logs for more details.']);
        }
    }

    public function destroy(Folder $folder): RedirectResponse
    {
        $this->authorize('delete', $folder);

        
        if ($folder->children()->count() > 0 || $folder->files()->count() > 0) {
            return redirect()->back()->withErrors([
                'folder' => 'Cannot delete folder that contains files or subfolders.'
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

        return redirect()->back()->with('success', 'Folder deleted successfully.');
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

        return redirect()->back()->with('success', 'Folder restored successfully.');
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

    private function formatFileSize($bytes)
    {
        if ($bytes === 0) return '0 Bytes';
        $k = 1024;
        $sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        $i = floor(log($bytes) / log($k));
        return round($bytes / pow($k, $i), 2) . ' ' . $sizes[$i];
    }
}


