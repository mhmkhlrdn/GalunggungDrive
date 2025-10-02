<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StorageLocation;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
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
            'visibility' => 'required|string|in:private,public',
            'is_active' => 'boolean',
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

        return Inertia::render('Admin/StorageLocations/Show', [
            'storageLocation' => $storageLocation,
            'diskStats' => $diskStats,
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
            'visibility' => 'required|string|in:private,public',
            'is_active' => 'boolean',
        ]);

        $storageLocation->update($validated);

        return redirect()->route('admin.storage-locations.index')
            ->with('success', 'Storage location updated successfully.');
    }

    public function destroy(StorageLocation $storageLocation): RedirectResponse
    {
        // Check if this storage location is being used by any files
        $filesCount = \App\Models\File::where('disk', $storageLocation->diskKey())->count();

        if ($filesCount > 0) {
            return redirect()->route('admin.storage-locations.index')
                ->with('error', "Cannot delete storage location. It is being used by {$filesCount} file(s).");
        }

        $storageLocation->delete();

        return redirect()->route('admin.storage-locations.index')
            ->with('success', 'Storage location deleted successfully.');
    }

    public function toggle(StorageLocation $storageLocation): RedirectResponse
    {
        $storageLocation->update(['is_active' => !$storageLocation->is_active]);

        $status = $storageLocation->is_active ? 'activated' : 'deactivated';

        return redirect()->route('admin.storage-locations.index')
            ->with('success', "Storage location {$status} successfully.");
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
