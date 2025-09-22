<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class FolderController extends Controller
{
    public function index(Request $request): Response
    {
        $parentId = $request->get('parent_id');
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $query = Folder::with(['user', 'parent'])
            ->where('user_id', auth()->id());

        if ($parentId) {
            $query->where('parent_id', $parentId);
        } else {
            $query->whereNull('parent_id');
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $folders = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        $currentFolder = $parentId ? Folder::find($parentId) : null;
        $breadcrumbs = $this->getBreadcrumbs($currentFolder);

        return Inertia::render('Folders/Index', [
            'folders' => $folders,
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
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:folders,id',
        ]);

        // Check if folder with same name exists in parent
        $existingFolder = Folder::where('user_id', auth()->id())
            ->where('parent_id', $request->parent_id)
            ->where('name', $request->name)
            ->first();

        if ($existingFolder) {
            return redirect()->back()->withErrors([
                'name' => 'A folder with this name already exists in this location.'
            ]);
        }

        $folder = Folder::create([
            'user_id' => auth()->id(),
            'parent_id' => $request->parent_id,
            'name' => $request->name,
        ]);

        ActivityLog::create([
            'user_id' => auth()->id(),
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

    public function show(Folder $folder): Response
    {
        $this->authorize('view', $folder);

        $folder->load(['user', 'parent', 'children', 'files', 'shares.sharedWith']);

        return Inertia::render('Folders/Show', [
            'folder' => $folder,
        ]);
    }

    public function update(Request $request, Folder $folder): RedirectResponse
    {
        $this->authorize('update', $folder);

        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // Check if folder with same name exists in parent
        $existingFolder = Folder::where('user_id', auth()->id())
            ->where('parent_id', $folder->parent_id)
            ->where('name', $request->name)
            ->where('id', '!=', $folder->id)
            ->first();

        if ($existingFolder) {
            return redirect()->back()->withErrors([
                'name' => 'A folder with this name already exists in this location.'
            ]);
        }

        $folder->update([
            'name' => $request->name,
        ]);

        return redirect()->back()->with('success', 'Folder updated successfully.');
    }

    public function destroy(Folder $folder): RedirectResponse
    {
        $this->authorize('delete', $folder);

        // Check if folder has children or files
        if ($folder->children()->count() > 0 || $folder->files()->count() > 0) {
            return redirect()->back()->withErrors([
                'folder' => 'Cannot delete folder that contains files or subfolders.'
            ]);
        }

        ActivityLog::create([
            'user_id' => auth()->id(),
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
            'user_id' => auth()->id(),
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
            ['title' => 'My Folders', 'href' => route('folders.index')],
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
                    'href' => route('folders.index', ['parent_id' => $folderItem->id]),
                ];
            }
        }

        return $breadcrumbs;
    }
}


