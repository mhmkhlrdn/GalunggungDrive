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
            'key' => 'required|string|max:255|unique:storage_locations,key',
            'driver' => 'required|string|in:local,s3,ftp',
            'root' => 'nullable|string|max:500',
            'url' => 'nullable|string|max:500|url',
            'visibility' => 'required|string|in:private,public',
            'serve' => 'boolean',
            'is_active' => 'boolean',
        ]);

        StorageLocation::create($validated);

        return redirect()->route('admin.storage-locations.index')
            ->with('success', 'Storage location created successfully.');
    }

    public function show(StorageLocation $storageLocation): Response
    {
        return Inertia::render('Admin/StorageLocations/Show', [
            'storageLocation' => $storageLocation,
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
            'key' => [
                'required',
                'string',
                'max:255',
                Rule::unique('storage_locations', 'key')->ignore($storageLocation->id),
            ],
            'driver' => 'required|string|in:local,s3,ftp',
            'root' => 'nullable|string|max:500',
            'url' => 'nullable|string|max:500|url',
            'visibility' => 'required|string|in:private,public',
            'serve' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $storageLocation->update($validated);

        return redirect()->route('admin.storage-locations.index')
            ->with('success', 'Storage location updated successfully.');
    }

    public function destroy(StorageLocation $storageLocation): RedirectResponse
    {
        // Check if this storage location is being used by any files
        $filesCount = \App\Models\File::where('storage_location_key', $storageLocation->key)->count();
        
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
}
