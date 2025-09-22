<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use App\Models\ActivityLog;
use App\Models\FileShare;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FileController extends Controller
{
    public function index(Request $request): Response
    {
        $folderId = $request->get('folder_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $query = File::with(['user', 'folder'])
            ->where('user_id', auth()->id());

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

        return Inertia::render('Files/Index', [
            'files' => $files,
            'currentFolder' => $currentFolder,
            'breadcrumbs' => $breadcrumbs,
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
            $validationRules['files.*'] .= '|mimes:' . implode(',', array_map(function($mime) {
                return str_replace(['image/', 'application/', 'text/', 'video/', 'audio/'], '', $mime);
            }, $uploadConfig['allowed_mime_types']));
        }
        
        $request->validate($validationRules);

        $uploadedFiles = [];

        foreach ($request->file('files') as $uploadedFile) {
            $storagePath = $uploadConfig['storage_path'] ?? 'files';
            $storageDisk = $uploadConfig['storage_disk'] ?? 'private';
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
                $breadcrumbs[] = [
                    'title' => $folderItem->name,
                    'href' => route('files.index', ['folder_id' => $folderItem->id]),
                ];
            }
        }

        return $breadcrumbs;
    }
}


