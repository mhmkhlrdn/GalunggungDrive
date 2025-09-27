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
use App\Models\StorageLocation;
use Inertia\Inertia;
use Inertia\Response;

class FileController extends Controller
{
    /**
     * Pick a storage disk from active storage locations based on free space.
     * Falls back to 'private' if none can be determined.
     */
    private function pickStorageDisk(): string
    {
        try {
            $locations = \App\Models\StorageLocation::query()
                ->where('is_active', true)
                ->get();

            $candidates = [];
            foreach ($locations as $loc) {
                // Only local driver free-space detection implemented
                if ($loc->driver === 'local' && $loc->root) {
                    try {
                        $freeBytes = @disk_free_space($loc->root);
                        if ($freeBytes !== false) {
                            $candidates[] = [
                                'key' => $loc->key,
                                'free' => (int) $freeBytes,
                            ];
                        }
                    } catch (\Throwable $e) {
                        // ignore unreadable paths
                    }
                }
            }

            if (!empty($candidates)) {
                // choose disk with most free space
                usort($candidates, function ($a, $b) { return $b['free'] <=> $a['free']; });
                return $candidates[0]['key'];
            }
        } catch (\Throwable $e) {
            // ignore and fall back
        }

        // fallback to configured or private
        return config('upload.storage_disk') ?? 'private';
    }
    public function index(Request $request): Response
    {
        $folderId = $request->get('folder_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $query = File::with(['user', 'folder'])
            ->where(function ($q) {
                $q->where('user_id', auth()->id())
                  ->orWhere('visibility', 'public');
            });

        if ($folderId) {
            $query->where('folder_id', $folderId);
        } else {
            $query->whereNull('folder_id');
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        $files = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        $currentFolder = $folderId ? Folder::find($folderId) : null;
        $breadcrumbs = $this->getBreadcrumbs($currentFolder);

        // Get all folders for move functionality
        $allFolders = Folder::where('user_id', auth()->id())
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);

        // Get all users for sharing
        $users = \App\Models\User::where('id', '!=', auth()->id())
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
        
        // Add MIME type validation if configured
        if (!empty($uploadConfig['allowed_mime_types'])) {
            // Use mimetypes rule to validate against actual MIME types from config
            $validationRules['files.*'] .= '|mimetypes:' . implode(',', $uploadConfig['allowed_mime_types']);
        }
        
        $request->validate($validationRules);

        // Auto-select storage disk based on available free space
        $storageDisk = $this->pickStorageDisk();

        $uploadedFiles = [];

        foreach ($request->file('files') as $uploadedFile) {
            $storagePath = $uploadConfig['storage_path'] ?? 'files';
            $path = $uploadedFile->store($storagePath, $storageDisk);
            $checksum = hash_file('sha256', $uploadedFile->getRealPath());

            $file = File::create([
                'user_id' => auth()->id(),
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

            // Create initial version
            $file->versions()->create([
                'version_number' => 1,
                'path' => $path,
                'size' => $uploadedFile->getSize(),
                'mime_type' => $uploadedFile->getMimeType(),
                'checksum' => $checksum,
                'uploaded_by' => auth()->id(),
            ]);

            // Log activity
            ActivityLog::create([
                'user_id' => auth()->id(),
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

        // Get sharing information
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
        ]);

        $file->update([
            'name' => $request->name,
            'description' => $request->description,
            'tags' => $request->tags ? explode(',', $request->tags) : null,
            'visibility' => $request->visibility,
        ]);

        return redirect()->back()->with('success', 'File updated successfully.');
    }

    public function destroy(File $file): RedirectResponse
    {
        $this->authorize('delete', $file);

        // Log activity before deletion
        ActivityLog::create([
            'user_id' => auth()->id(),
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
        $this->authorize('view', $file);

        // Log download activity
        ActivityLog::create([
            'user_id' => auth()->id(),
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

        return Storage::disk($file->disk)->download($file->path, $file->name);
    }

    public function preview(File $file)
    {
        try {
            $this->authorize('view', $file);

            // Check if file exists
            if (!Storage::disk($file->disk)->exists($file->path)) {
                abort(404, 'File not found');
            }

            // Log preview activity
            ActivityLog::create([
                'user_id' => auth()->id(),
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

            // Get file content
            $fileContent = Storage::disk($file->disk)->get($file->path);
            
            // Return the file for preview (inline display)
            return response($fileContent)
                ->header('Content-Type', $file->mime_type)
                ->header('Content-Disposition', 'inline; filename="' . $file->name . '"')
                ->header('Content-Length', strlen($fileContent))
                ->header('Cache-Control', 'public, max-age=3600');
        } catch (\Exception $e) {
            // Log the error
            ActivityLog::create([
                'user_id' => auth()->id(),
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
            'user_id' => auth()->id(),
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
                ->where('user_id', auth()->id())
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
            'user_id' => auth()->id(),
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
            ['title' => 'My Files', 'href' => route('files.index')],
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
}


