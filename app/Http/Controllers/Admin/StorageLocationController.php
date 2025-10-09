<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Response;

class StorageLocationController extends Controller
{
    public function index(): Response
    {
        $storageLocations = StorageLocation::orderBy('name')->get();

        return Inertia::render('Admin/StorageLocations/Index', [
            'storageLocations' => $storageLocations,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/StorageLocations/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'root' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'can_serve' => 'boolean',
        ]);

        StorageLocation::create($validated);

        return redirect()->route('admin.storage-locations.index')
            ->with('success', 'Storage location created successfully.');
    }

    public function show(StorageLocation $storageLocation): Response
    {
        // attempt to compute disk stats for local roots
        $diskStats = [
            'total' => null,
            'free' => null,
            'available' => null,
        ];
        if ($storageLocation->root) {
            try {
                $diskStats['total'] = @disk_total_space($storageLocation->root) ?: null;
                $diskStats['free'] = @disk_free_space($storageLocation->root) ?: null;
                if ($diskStats['total'] !== null && $diskStats['free'] !== null) {
                    $diskStats['available'] = $diskStats['total'] - $diskStats['free'];
                }
            } catch (\Throwable $e) {
                // ignore
            }
        }

        $otherLocations = StorageLocation::where('id', '!=', $storageLocation->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/StorageLocations/Show', [
            'storageLocation' => $storageLocation,
            'diskStats' => $diskStats,
            'otherLocations' => $otherLocations,
        ]);
    }

    public function edit(StorageLocation $storageLocation): Response
    {
        return Inertia::render('Admin/StorageLocations/Edit', [
            'storageLocation' => $storageLocation,
        ]);
    }

    public function update(Request $request, StorageLocation $storageLocation): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'root' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'can_serve' => 'boolean',
        ]);

        $storageLocation->update($validated);

        return redirect()->route('admin.storage-locations.index')
            ->with('success', 'Storage location updated successfully.');
    }

    private function deletePhysicalFileAndVersions(File $file): void
    {
        try {
            if ($file->disk && $file->path) {
                try { Storage::disk($file->disk)->delete($file->path); } catch (\Throwable $e) { /* ignore */ }
            }

            $file->versions()->each(function ($version) use ($file) {
                if ($version->path) {
                    try { Storage::disk($file->disk)->delete($version->path); } catch (\Throwable $e) { /* ignore */ }
                }
            });
        } catch (\Throwable $e) {
        }
    }

    public function destroy(StorageLocation $storageLocation): RedirectResponse
{
    DB::beginTransaction();

    try {
        $files = File::where('disk_id', $storageLocation->id)->get();

        foreach ($files as $file) {
            $this->deletePhysicalFileAndVersions($file);
            $file->forceDelete();
        }

        $storageLocation->delete();

        DB::commit();

        return redirect()
            ->route('admin.storage-locations.index')
            ->with('success', 'Storage location and all its files deleted successfully.');
    } catch (\Exception $e) {
        DB::rollBack();

        return redirect()
            ->route('admin.storage-locations.index')
            ->with('error', 'Error deleting storage location: ' . $e->getMessage());
    }
}


    public function toggle(StorageLocation $storageLocation): RedirectResponse
    {
        $storageLocation->update(['is_active' => !$storageLocation->is_active]);

        $status = $storageLocation->is_active ? 'activated' : 'deactivated';

        return redirect()->route('admin.storage-locations.index')
            ->with('success', "Storage location {$status} successfully.");
    }

    public function toggleServe(StorageLocation $storageLocation): RedirectResponse
    {
        $storageLocation->update(['can_serve' => !$storageLocation->can_serve]);

        $status = $storageLocation->can_serve ? 'enabled to serve' : 'disabled from serving';

        return redirect()->route('admin.storage-locations.index')
            ->with('success', "Serving status {$status} successfully.");
    }

    public function backup(Request $request, StorageLocation $storageLocation): RedirectResponse
    {
        $data = $request->validate([
            'target_storage_location_id' => 'required|exists:storage_locations,id',
        ]);

        $target = StorageLocation::findOrFail($data['target_storage_location_id']);
        if ($target->id === $storageLocation->id) {
            return redirect()->back()->withErrors(['target_storage_location_id' => 'Lokasi tujuan tidak boleh sama.']);
        }

        $sourceDisk = $storageLocation->diskKey();
        $targetDisk = $target->diskKey();

        $files = \App\Models\File::where('disk_id', $storageLocation->id)->get();
        $copied = 0;
        foreach ($files as $file) {
            try {
                // Copy physical file if exists
                if (\Illuminate\Support\Facades\Storage::disk($sourceDisk)->exists($file->path)) {
                    $contents = \Illuminate\Support\Facades\Storage::disk($sourceDisk)->get($file->path);
                    \Illuminate\Support\Facades\Storage::disk($targetDisk)->put($file->path, $contents);
                }

                // Duplicate DB row to target disk
                \App\Models\File::create([
                    'user_id' => $file->user_id,
                    'folder_id' => $file->folder_id,
                    'name' => $file->name,
                    'path' => $file->path,
                    'disk_id' => $target->id,
                    'size' => $file->size,
                    'mime_type' => $file->mime_type,
                    'checksum' => $file->checksum,
                    'description' => $file->description,
                    'visibility' => $file->visibility,
                    'tags' => $file->tags,
                ]);
                $copied++;
            } catch (\Throwable $e) {
                // continue on error; optionally collect errors for report
                continue;
            }
        }

        return redirect()->route('admin.storage-locations.index')
            ->with('success', 'Backup selesai: ' . $copied . ' file disalin ke lokasi baru.');
    }

    /**
     * Browse server directories for picking a root path.
     */
    public function browse(Request $request)
    {
        // Route already protected by admin middleware

        $path = $request->query('path', DIRECTORY_SEPARATOR);
        $path = rtrim($path, DIRECTORY_SEPARATOR);
        if ($path === '') { $path = DIRECTORY_SEPARATOR; }

        $response = [
            'path' => $path,
            'parent' => null,
            'directories' => [],
        ];

        try {
            $real = @realpath($path) ?: $path;
            if (!@is_dir($real)) {
                return response()->json(['error' => 'Path is not a directory'], 400);
            }

            // Compute parent path if possible
            $parent = dirname($real);
            if ($parent && $parent !== $real) {
                $response['parent'] = $parent;
            }

            $items = @scandir($real) ?: [];
            foreach ($items as $item) {
                if ($item === '.' || $item === '..') continue;
                $full = $real . DIRECTORY_SEPARATOR . $item;
                if (@is_dir($full) && @is_readable($full)) {
                    $response['directories'][] = $full;
                }
            }
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Unable to read directory'], 500);
        }

        return response()->json($response);
    }
}
