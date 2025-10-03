<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\FileVersion;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class FileVersionController extends Controller
{
    public function index(File $file): Response
    {
        $this->authorize('view', $file);

        $versions = FileVersion::where('file_id', $file->id)
            ->with('uploadedBy')
            ->orderBy('version_number', 'desc')
            ->get();

        return Inertia::render('Files/Versions', [
            'file' => $file,
            'versions' => $versions,
        ]);
    }

    public function store(Request $request, File $file): RedirectResponse
    {
        $this->authorize('update', $file);

        $request->validate([
            'file' => 'required|file',
        ]);

        $uploadedFile = $request->file('file');

        // Ensure file's storage location is active and can serve uploads
        $storageLocation = $file->storageLocation()->first();
        if (!$storageLocation || !$storageLocation->is_active) {
            return redirect()->back()->withErrors(['file' => 'Lokasi penyimpanan tidak aktif.']);
        }
        if (!(bool) ($storageLocation->can_serve ?? false)) {
            return redirect()->back()->withErrors(['file' => 'Lokasi penyimpanan tidak tersedia untuk upload versi.']);
        }

        // Get next version number
        $nextVersion = FileVersion::where('file_id', $file->id)->max('version_number') + 1;

        // Store the new version on the same storage location
        $path = $uploadedFile->store('files/versions', $storageLocation->diskKey());
        $checksum = hash_file('sha256', $uploadedFile->getRealPath());

        $version = FileVersion::create([
            'file_id' => $file->id,
            'version_number' => $nextVersion,
            'path' => $path,
            'size' => $uploadedFile->getSize(),
            'mime_type' => $uploadedFile->getMimeType(),
            'checksum' => $checksum,
            'uploaded_by' => auth()->id(),
        ]);

        // Update the main file record
        $file->update([
            'path' => $path,
            'size' => $uploadedFile->getSize(),
            'mime_type' => $uploadedFile->getMimeType(),
            'checksum' => $checksum,
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
                'action' => 'version_upload',
                'file_name' => $file->name,
                'version_number' => $nextVersion,
                'file_size' => $uploadedFile->getSize(),
            ],
        ]);

        return redirect()->back()->with('success', "Versi {$nextVersion} berhasil diunggah.");
    }

    public function restore(File $file, FileVersion $version): RedirectResponse
    {
        $this->authorize('update', $file);

        // Update the main file to use this version
        $file->update([
            'path' => $version->path,
            'size' => $version->size,
            'mime_type' => $version->mime_type,
            'checksum' => $version->checksum,
        ]);

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'restore',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'action' => 'version_restore',
                'file_name' => $file->name,
                'version_number' => $version->version_number,
            ],
        ]);

        return redirect()->back()->with('success', "File berhasil dikembalikan ke versi {$version->version_number}.");
    }

    public function download(File $file, FileVersion $version)
    {
        $this->authorize('download', $file);

        // Log download
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'download',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'action' => 'version_download',
                'file_name' => $file->name,
                'version_number' => $version->version_number,
            ],
        ]);

        return Storage::disk('private')->download($version->path, "{$file->name} (v{$version->version_number})");
    }

    public function destroy(File $file, FileVersion $version): RedirectResponse
    {
        $this->authorize('delete', $file);

        // Don't allow deleting the only version
        $versionCount = FileVersion::where('file_id', $file->id)->count();
        if ($versionCount <= 1) {
            return redirect()->back()->with('error', 'Tidak dapat menghapus satu-satunya versi file.');
        }

        // Delete the file from storage
        Storage::disk('private')->delete($version->path);

        $versionNumber = $version->version_number;
        $version->delete();

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'delete',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'action' => 'version_delete',
                'file_name' => $file->name,
                'version_number' => $versionNumber,
            ],
        ]);

        return redirect()->back()->with('success', "Versi {$versionNumber} berhasil dihapus.");
    }
}
