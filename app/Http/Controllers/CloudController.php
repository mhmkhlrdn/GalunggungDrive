<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CloudController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        /** @var User $user */
        $userId = $user->id;

        $folders = Folder::with('user')
            ->whereNull('parent_id')
            ->where(function ($q) use ($userId, $user) {
                if ($user->isSuperAdmin()) {
                    
                } elseif ($user->isAdmin()) {
                    
                    $q->where('user_id', $userId)
                      ->orWhere('visibility', 'public')
                      ->orWhere('visibility', 'shared')
                      ->orWhereHas('shares', function ($shareQuery) use ($userId) {
                          $shareQuery->where('shared_with', $userId)
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                } elseif (($user->role ?? null) === 'staff') {
                    $q->where('user_id', $userId);
                } else {
                    $q->where('user_id', $userId)
                      ->orWhere('visibility', 'public')
                      ->orWhere('visibility', 'shared')
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


        
        $allFiles = collect();

        
        $files = File::with(['user', 'storageLocation'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
            ->whereNull('folder_id')
            ->where(function ($q) use ($userId, $user) {
                if ($user->isSuperAdmin()) {
                    
                } elseif ($user->isAdmin()) {
                    
                    $q->where('user_id', $userId)
                      ->orWhere('visibility', 'public')
                      ->orWhere('visibility', 'shared')
                      ->orWhereHas('shares', function ($shareQuery) use ($userId) {
                          $shareQuery->where('shared_with', $userId)
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                } elseif (($user->role ?? null) === 'staff') {
                    
                    $q->where('user_id', $userId);
                } else {
                    
                    $q->where('user_id', $userId)
                      ->orWhere('visibility', 'public')
                      ->orWhere('visibility', 'shared')
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

        
        $users = \App\Models\User::where('id', '!=', $userId)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

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
            
            'breadcrumbs' => [
                ['title' => 'Cloud', 'href' => route('cloud.index')],
            ],
            'users' => $users,
        ]);
    }
}


