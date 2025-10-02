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
use App\Models\StorageLocation;
use Inertia\Inertia;
use Inertia\Response;

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
        $folderId = $request->get('folder_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $query = File::with(['user', 'folder'])
            ->where('user_id', Auth::id());

        if ($folderId) {
            $query->where('folder_id', $folderId);
        }
        // If no specific folder is requested, show all user's files (don't filter by folder_id)

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        $files = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        $files->getCollection()->transform(function ($file) {
            $file->starred = $file->isStarredBy(Auth::user());
            return $file;
        });

        $currentFolder = $folderId ? Folder::find($folderId) : null;
        $breadcrumbs = $this->getBreadcrumbs($currentFolder);

        $allFolders = Folder::where('user_id', Auth::id())
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);

        $users = \App\Models\User::where('id', '!=', Auth::id())
            ->select('id', 'name', 'email')
            ->get();

        return Inertia::render('Files/Index', [
            'files' => $files,
            'currentFolder' => $currentFolder,
            'breadcrumbs' => $breadcrumbs,
            'folders' => $allFolders,
            'users' => $users,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $uploadConfig = config('upload', []);

        $validationRules = [
            'files' => 'required|array|min:1',
            'files.*' => 'file',
            'folder_id' => 'nullable|exists:folders,id',
            'description' => 'nullable|string|max:1000',
            'tags' => 'nullable|string',
            'visibility' => 'required|in:private,shared,public',
        ];


        if (!empty($uploadConfig['allowed_mime_types'])) {
            $validationRules['files.*'] .= '|mimetypes:' . implode(',', $uploadConfig['allowed_mime_types']);
        }

        $request->validate($validationRules);

        $storageDisk = $this->pickStorageDisk();

        $uploadedFiles = [];

        foreach ($request->file('files') as $uploadedFile) {
            $storagePath = $uploadConfig['storage_path'] ?? 'files';
            $path = $uploadedFile->store($storagePath, $storageDisk);
            $checksum = hash_file('sha256', $uploadedFile->getRealPath());

            $file = File::create([
                'user_id' => Auth::id(),
                'folder_id' => $request->folder_id,
                'name' => $uploadedFile->getClientOriginalName(),
                'path' => $path,
                'disk' => $storageDisk,
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

        return redirect()->back()->with('success',
            count($uploadedFiles) . ' file(s) uploaded successfully.'
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

        if (!Storage::disk($file->disk)->exists($file->path)) {
            abort(404, 'File not found');
        }

        return Storage::disk($file->disk)->download($file->path, $file->name);
    }

    public function preview(File $file)
    {
        try {
            $this->authorize('view', $file);

            if (!Storage::disk($file->disk)->exists($file->path)) {
                abort(404, 'File not found');
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

            $fileContent = Storage::disk($file->disk)->get($file->path);

            return response($fileContent)
                ->header('Content-Type', $file->mime_type)
                ->header('Content-Disposition', 'inline; filename="' . $file->name . '"')
                ->header('Content-Length', strlen($fileContent))
                ->header('Cache-Control', 'public, max-age=3600');
        } catch (\Exception $e) {
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
                ],
            ]);

            abort(500, 'Failed to load file preview: ' . $e->getMessage());
        }
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

        // Check if the target folder belongs to the user
        if ($request->folder_id) {
            $folder = Folder::where('id', $request->folder_id)
                ->where('user_id', Auth::id())
                ->first();

            if (!$folder) {
                return redirect()->back()->withErrors([
                    'folder_id' => 'Invalid folder selected.'
                ]);
            }
        }

        $oldFolderId = $file->folder_id;
        $file->update([
            'folder_id' => $request->folder_id,
        ]);

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
}


