<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use App\Models\User; // Add this line
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CloudController extends Controller
{
    public function index(): Response
    {
        /** @var User $user */ // Add this line
        $user = Auth::user();
        $userId = $user->id;


        $user = Auth::user();

        $folders = Folder::with('user')
            ->whereNull('parent_id')
            ->where(function ($q) use ($userId, $user) {
                if ($user->is_super_admin || ($user->is_admin ?? false)) {
                    // Super Admin/Admin: see all folders
                } elseif (($user->role ?? null) === 'staff') {
                    // Staff users can only see their own folders
                    $q->where('user_id', $userId);
                } else {
                    // Regular users and admins see their own, public, and shared folders
                    $q->where('user_id', $userId)
                      ->orWhere('visibility', 'public')
                      ->orWhereHas('shares', function ($shareQuery) use ($userId) {
                          $shareQuery->where('shared_with', $userId)
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                }
            })
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id', 'user_id', 'updated_at']);


        // Get all files (including those in folders) for comprehensive search
        $allFiles = File::with(['user', 'folder', 'storageLocation'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
            ->where(function ($q) use ($userId, $user) {
                if ($user->is_super_admin || ($user->is_admin ?? true)) {
                    // Super Admin/Admin: see all files
                } elseif (($user->role ?? null) === 'staff') {
                    // Staff users can only see their own files
                    $q->where('user_id', $userId);
                } else {
                    // Regular users and admins see their own, public, and shared files
                    $q->where('user_id', $userId)
                      ->orWhere('visibility', 'public')
                      ->orWhereHas('shares', function ($shareQuery) use ($userId) {
                          $shareQuery->where('shared_with', $userId)
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                }
            })
            ->orderBy('updated_at', 'desc')
            ->get();

        // Get root-level files for display
        $files = File::with(['user', 'storageLocation'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
            ->whereNull('folder_id')
            ->where(function ($q) use ($userId, $user) {
                if ($user->is_super_admin || ($user->is_admin ?? false)) {
                    // Super Admin/Admin: see all files
                } elseif (($user->role ?? null) === 'staff') {
                    // Staff users can only see their own files
                    $q->where('user_id', $userId);
                } else {
                    // Regular users and admins see their own, public, and shared files
                    $q->where('user_id', $userId)
                      ->orWhere('visibility', 'public')
                      ->orWhereHas('shares', function ($shareQuery) use ($userId) {
                          $shareQuery->where('shared_with', $userId)
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                }
            })
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        return Inertia::render('Cloud/Index', [
            'folders' => $folders->map(function ($f) {
                return [
                    'id' => $f->id,
                    'name' => $f->name,
                    'updated_at' => $f->updated_at->toISOString(),
                    'user' => [
                        'id' => $f->user->id,
                        'name' => $f->user->name,
                    ],
                ];
            }),
            'files' => [
                'data' => $files->getCollection()->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'name' => $file->name,
                        'size' => $file->size,
                        'mime_type' => $file->mime_type,
                        'updated_at' => $file->updated_at->toISOString(),
                        'visibility' => $file->visibility,
                        'starred' => $file->isStarredBy(Auth::user()),
                        'user' => [
                            'id' => $file->user->id,
                            'name' => $file->user->name,
                        ],
                    ];
                }),
                'current_page' => $files->currentPage(),
                'last_page' => $files->lastPage(),
                'per_page' => $files->perPage(),
                'total' => $files->total(),
            ],
            'allFiles' => $allFiles->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'size' => $file->size,
                    'mime_type' => $file->mime_type,
                    'updated_at' => $file->updated_at->toISOString(),
                    'visibility' => $file->visibility,
                    'starred' => $file->isStarredBy(Auth::user()),
                    'user' => [
                        'id' => $file->user->id,
                        'name' => $file->user->name,
                    ],
                    'folder' => $file->folder ? [
                        'id' => $file->folder->id,
                        'name' => $file->folder->name,
                    ] : null,
                ];
            }),
            'breadcrumbs' => [
                ['title' => 'Cloud', 'href' => route('cloud.index')],
            ],
        ]);
    }
}


