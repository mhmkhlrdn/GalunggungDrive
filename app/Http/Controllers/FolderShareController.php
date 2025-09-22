<?php

namespace App\Http\Controllers;

use App\Models\Folder;
use App\Models\FolderShare;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FolderShareController extends Controller
{
    public function create(Folder $folder): Response
    {
        $this->authorize('view', $folder);
        
        $users = User::where('id', '!=', auth()->id())
            ->select('id', 'name', 'email')
            ->get();

        return Inertia::render('Folders/Share', [
            'folder' => $folder,
            'users' => $users,
        ]);
    }

    public function store(Request $request, Folder $folder): RedirectResponse
    {
        $this->authorize('view', $folder);

        $request->validate([
            'shared_with' => 'nullable|exists:users,id',
            'permission' => 'required|in:view,edit',
            'expires_at' => 'nullable|date|after:now',
            'is_public_link' => 'boolean',
        ]);

        // Check if it's a public link or user-specific share
        if ($request->is_public_link) {
            $token = Str::random(32);
            $sharedWith = null;
        } else {
            $token = null;
            $sharedWith = $request->shared_with;
            
            // Check if already shared with this user
            $existingShare = FolderShare::where('folder_id', $folder->id)
                ->where('shared_with', $sharedWith)
                ->first();
                
            if ($existingShare) {
                return redirect()->back()->with('error', 'Folder sudah dibagikan dengan pengguna ini.');
            }
        }

        $share = FolderShare::create([
            'folder_id' => $folder->id,
            'shared_by' => auth()->id(),
            'shared_with' => $sharedWith,
            'permission' => $request->permission,
            'expires_at' => $request->expires_at,
            'token' => $token,
            'is_public_link' => $request->is_public_link ?? false,
        ]);

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'share',
            'target_type' => 'folder',
            'target_id' => $folder->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'success' => true,
            'details' => [
                'folder_name' => $folder->name,
                'shared_with' => $sharedWith ? User::find($sharedWith)->name : 'Public Link',
                'permission' => $request->permission,
                'expires_at' => $request->expires_at,
            ],
        ]);

        $message = $request->is_public_link 
            ? 'Link publik folder berhasil dibuat.' 
            : 'Folder berhasil dibagikan.';

        return redirect()->back()->with('success', $message);
    }

    public function update(Request $request, FolderShare $folderShare): RedirectResponse
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

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'share',
            'target_type' => 'folder',
            'target_id' => $folderShare->folder_id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'success' => true,
            'details' => [
                'action' => 'update_share',
                'folder_name' => $folderShare->folder->name,
                'permission' => $request->permission,
            ],
        ]);

        return redirect()->back()->with('success', 'Pengaturan berbagi folder berhasil diperbarui.');
    }

    public function destroy(FolderShare $folderShare): RedirectResponse
    {
        $this->authorize('delete', $folderShare);

        $folderName = $folderShare->folder->name;
        $folderShare->delete();

        // Log activity
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => 'share',
            'target_type' => 'folder',
            'target_id' => $folderShare->folder_id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'action' => 'remove_share',
                'folder_name' => $folderName,
            ],
        ]);

        return redirect()->back()->with('success', 'Berbagi folder berhasil dihapus.');
    }

    public function publicAccess(string $token)
    {
        $share = FolderShare::where('token', $token)
            ->where('is_public_link', true)
            ->with(['folder.files', 'folder.children'])
            ->first();

        if (!$share) {
            abort(404, 'Link tidak ditemukan atau sudah tidak valid.');
        }

        if ($share->expires_at && $share->expires_at->isPast()) {
            abort(410, 'Link sudah kedaluwarsa.');
        }

        $folder = $share->folder;

        // Log access
        ActivityLog::create([
            'user_id' => null,
            'action' => 'view',
            'target_type' => 'folder',
            'target_id' => $folder->id,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'success' => true,
            'details' => [
                'folder_name' => $folder->name,
                'access_type' => 'public_link',
                'token' => $token,
            ],
        ]);

        return Inertia::render('Folders/PublicView', [
            'folder' => $folder,
            'share' => $share,
        ]);
    }
}
