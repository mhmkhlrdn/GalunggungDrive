<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\Folder;
use App\Models\FileShare;
use App\Models\FolderShare;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class ShareController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $sharedByMeFiles = File::with(['shares' => function($query) use ($user) {
            $query->where('shared_by', $user->id)->with('sharedWith');
        }])
        ->whereHas('shares', function($query) use ($user) {
            $query->where('shared_by', $user->id);
        })
        ->orderBy('updated_at', 'desc')
        ->paginate(20);

        $sharedWithMe = FileShare::with(['file', 'sharedBy'])
            ->where('shared_with', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $publicLinks = FileShare::with(['file'])
            ->where('shared_by', $user->id)
            ->where('is_public_link', true)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => [
                'shared_by_me' => $sharedByMeFiles->items(),
                'shared_with_me' => $sharedWithMe->items(),
                'public_links' => $publicLinks->items(),
            ],
            'meta' => [
                'shared_by_me' => [
                    'current_page' => $sharedByMeFiles->currentPage(),
                    'last_page' => $sharedByMeFiles->lastPage(),
                    'total' => $sharedByMeFiles->total(),
                ],
                'shared_with_me' => [
                    'current_page' => $sharedWithMe->currentPage(),
                    'last_page' => $sharedWithMe->lastPage(),
                    'total' => $sharedWithMe->total(),
                ],
                'public_links' => [
                    'current_page' => $publicLinks->currentPage(),
                    'last_page' => $publicLinks->lastPage(),
                    'total' => $publicLinks->total(),
                ],
            ],
        ]);
    }

    public function shareFile(Request $request, File $file)
    {
        $this->authorize('view', $file);

        $request->validate([
            'shared_with' => 'nullable|exists:users,id',
            'permission' => 'required|in:view,edit',
            'expires_at' => 'nullable|date|after:now',
            'is_public_link' => 'boolean',
        ]);

        if ($request->is_public_link) {
            $token = Str::random(32);
            $sharedWith = null;
        } else {
            $token = null;
            $sharedWith = $request->shared_with;

            $existingShare = FileShare::where('file_id', $file->id)
                ->where('shared_with', $sharedWith)
                ->first();

            if ($existingShare) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File already shared with this user.',
                ], 400);
            }
        }

        $share = FileShare::create([
            'file_id' => $file->id,
            'shared_by' => Auth::id(),
            'shared_with' => $sharedWith,
            'permission' => $request->permission,
            'expires_at' => $request->expires_at,
            'token' => $token,
            'is_public_link' => $request->is_public_link ?? false,
        ]);

        ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => 'share',
            'target_type' => 'file',
            'target_id' => $file->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'success' => true,
            'details' => [
                'file_name' => $file->name,
                'shared_with' => $sharedWith ? User::find($sharedWith)->name : 'Public Link',
            ],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => $request->is_public_link ? 'Public link created successfully' : 'File shared successfully',
            'data' => $share,
        ], 201);
    }

    public function shareFolder(Request $request, Folder $folder)
    {
        $this->authorize('view', $folder);

        $request->validate([
            'shared_with' => 'nullable|exists:users,id',
            'permission' => 'required|in:view,edit',
            'expires_at' => 'nullable|date|after:now',
            'is_public_link' => 'boolean',
        ]);

        if ($request->is_public_link) {
            $token = Str::random(32);
            $sharedWith = null;
        } else {
            $token = null;
            $sharedWith = $request->shared_with;

            $existingShare = FolderShare::where('folder_id', $folder->id)
                ->where('shared_with', $sharedWith)
                ->first();

            if ($existingShare) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Folder already shared with this user.',
                ], 400);
            }
        }

        $share = FolderShare::create([
            'folder_id' => $folder->id,
            'shared_by' => Auth::id(),
            'shared_with' => $sharedWith,
            'permission' => $request->permission,
            'expires_at' => $request->expires_at,
            'token' => $token,
            'is_public_link' => $request->is_public_link ?? false,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => $request->is_public_link ? 'Public link created successfully' : 'Folder shared successfully',
            'data' => $share,
        ], 201);
    }

    public function updateFileShare(Request $request, FileShare $fileShare)
    {
        $this->authorize('update', $fileShare);

        $request->validate([
            'permission' => 'required|in:view,edit',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $fileShare->update([
            'permission' => $request->permission,
            'expires_at' => $request->expires_at,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Share updated successfully',
            'data' => $fileShare,
        ]);
    }

    public function destroyFileShare(FileShare $fileShare)
    {
        $this->authorize('delete', $fileShare);
        $fileShare->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Share deleted successfully',
        ]);
    }

    public function updateFolderShare(Request $request, FolderShare $folderShare)
    {
        $this->authorize('update', $folderShare);

        $request->validate([
            'permission' => 'required|in:view,edit',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $folderShare->update([
            'permission' => $request->permission,
            'expires_at' => $request->expires_at,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Share updated successfully',
            'data' => $folderShare,
        ]);
    }

    public function destroyFolderShare(FolderShare $folderShare)
    {
        $this->authorize('delete', $folderShare);
        $folderShare->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Share deleted successfully',
        ]);
    }

    public function getFileShares(File $file)
    {
        $this->authorize('view', $file);

        $shares = FileShare::where('file_id', $file->id)
            ->with(['sharedWith', 'sharedBy'])
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $shares,
        ]);
    }
}

