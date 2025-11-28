<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class RecruitmentFileController extends Controller
{
    /**
     * Preview a file uploaded by GASNET Rekrutmen
     * This endpoint is specifically for the recruitment website to access applicant files
     */
    public function preview(Request $request, $fileId)
    {
        try {
            // Find the file
            $file = File::find($fileId);
            
            if (!$file) {
                abort(404, 'File not found');
            }

            // Verify the file belongs to the recruitment user (rekrutmen@gas.net.id)
            // This ensures only recruitment files can be accessed through this endpoint
            if ($file->user->email !== 'rekrutmen@gas.net.id') {
                abort(403, 'Unauthorized access to file');
            }

            // Check if storage location exists and is active
            if (!$file->storageLocation || !$file->storageLocation->is_active) {
                abort(404, 'File storage not available');
            }

            // Get the disk key for this file
            $diskKey = $file->storageLocation->diskKey();
            
            // Check if file exists in storage
            if (!Storage::disk($diskKey)->exists($file->path)) {
                Log::error('File not found in storage', [
                    'file_id' => $fileId,
                    'path' => $file->path,
                    'disk' => $diskKey,
                ]);
                abort(404, 'File not found in storage');
            }

            // Get the full path to the file
            $filePath = Storage::disk($diskKey)->path($file->path);
            
            // Determine content type
            $mimeType = $file->mime_type ?? Storage::disk($diskKey)->mimeType($file->path);
            
            // Return the file for inline display
            return response()->file($filePath, [
                'Content-Type' => $mimeType,
                'Content-Disposition' => 'inline; filename="' . $file->name . '"',
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to preview recruitment file', [
                'file_id' => $fileId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            abort(500, 'Failed to load file');
        }
    }

    /**
     * Download a file uploaded by GASNET Rekrutmen
     */
    public function download(Request $request, $fileId)
    {
        try {
            // Find the file
            $file = File::find($fileId);
            
            if (!$file) {
                abort(404, 'File not found');
            }

            // Verify the file belongs to the recruitment user
            if ($file->user->email !== 'rekrutmen@gas.net.id') {
                abort(403, 'Unauthorized access to file');
            }

            // Check if storage location exists and is active
            if (!$file->storageLocation || !$file->storageLocation->is_active) {
                abort(404, 'File storage not available');
            }

            // Get the disk key for this file
            $diskKey = $file->storageLocation->diskKey();
            
            // Check if file exists in storage
            if (!Storage::disk($diskKey)->exists($file->path)) {
                Log::error('File not found in storage', [
                    'file_id' => $fileId,
                    'path' => $file->path,
                    'disk' => $diskKey,
                ]);
                abort(404, 'File not found in storage');
            }

            // Get the full path to the file
            $filePath = Storage::disk($diskKey)->path($file->path);
            
            // Return the file as download
            return response()->download($filePath, $file->name);
            
        } catch (\Exception $e) {
            Log::error('Failed to download recruitment file', [
                'file_id' => $fileId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            abort(500, 'Failed to download file');
        }
    }
}
