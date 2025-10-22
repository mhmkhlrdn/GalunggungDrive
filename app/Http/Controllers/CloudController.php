<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class CloudController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();
        /** @var User $user */
        $userId = $user->id;

        // Cache key based on user and permissions
        $cacheKey = "cloud_data_{$userId}_" . ($user->isSuperAdmin() ? 'super' : ($user->isAdmin() ? 'admin' : 'user'));

        // Try to get cached data first
        $cachedData = Cache::remember($cacheKey, 300, function () use ($userId, $user) {
            return $this->getCloudData($userId, $user);
        });

        return Inertia::render('Cloud/Index', $cachedData);
    }

    private function getCloudData(int $userId, User $user): array
    {
        // Optimized folder query with proper eager loading
        $folders = $this->getOptimizedFolders($userId, $user);

        // Optimized files query with pagination
        $files = $this->getOptimizedFiles($userId, $user);

        // Get users for sharing (cached separately)
        $users = Cache::remember("users_for_sharing_{$userId}", 600, function () use ($userId) {
            return \App\Models\User::where('id', '!=', $userId)
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get();
        });

        return [
            'folders' => $folders,
            'files' => $files,
            'breadcrumbs' => [
                ['title' => 'Cloud', 'href' => route('cloud.index')],
            ],
            'users' => $users,
        ];
    }

    private function getOptimizedFolders(int $userId, User $user): array
    {
        $query = Folder::with(['user:id,name'])
            ->whereNull('parent_id')
            ->select(['id', 'name', 'parent_id', 'user_id', 'updated_at']);

        // Apply visibility rules based on user role
        if (!$user->isSuperAdmin()) {
            if ($user->isAdmin()) {
                $query->where(function ($q) use ($userId) {
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
                });
            } elseif (($user->role ?? null) === 'staff') {
                $query->where('user_id', $userId);
            } else {
                $query->where(function ($q) use ($userId) {
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
                });
            }
        }

        return $query->orderBy('name')->get()->map(function ($folder) {
            return [
                'id' => $folder->id,
                'name' => $folder->name,
                'updated_at' => $folder->updated_at->toISOString(),
                'user' => [
                    'id' => $folder->user->id,
                    'name' => $folder->user->name,
                ],
            ];
        })->toArray();
    }

    private function getOptimizedFiles(int $userId, User $user): array
    {
        $query = File::with(['user:id,name', 'storageLocation:id,name,is_active'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
            ->whereNull('folder_id')
            ->select(['id', 'name', 'size', 'mime_type', 'updated_at', 'visibility', 'user_id', 'disk_id']);

        // Apply visibility rules based on user role
        if (!$user->isSuperAdmin()) {
            if ($user->isAdmin()) {
                $query->where(function ($q) use ($userId) {
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
                });
            } elseif (($user->role ?? null) === 'staff') {
                $query->where('user_id', $userId);
            } else {
                $query->where(function ($q) use ($userId) {
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
                });
            }
        }

        $files = $query->orderBy('updated_at', 'desc')->paginate(20);

        // Get starred status for current user in batch
        $fileIds = $files->pluck('id')->toArray();
        $starredFiles = \DB::table('user_starred')
            ->where('user_id', $userId)
            ->whereIn('file_id', $fileIds)
            ->pluck('file_id')
            ->toArray();

        return [
            'data' => $files->getCollection()->map(function ($file) use ($starredFiles) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'size' => $file->size,
                    'mime_type' => $file->mime_type,
                    'updated_at' => $file->updated_at->toISOString(),
                    'visibility' => $file->visibility,
                    'starred' => in_array($file->id, $starredFiles),
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
        ];
    }

    public function search()
    {
        $user = Auth::user();
        $query = request()->get('q', '');

        if (strlen($query) < 2) {
            return response()->json(['files' => [], 'folders' => []]);
        }

        $cacheKey = "cloud_search_{$user->id}_" . md5($query);

        return Cache::remember($cacheKey, 60, function () use ($query, $user) {
            // Search files
            $filesQuery = File::with(['user:id,name', 'storageLocation:id,name,is_active'])
                ->whereHas('storageLocation', function ($q) {
                    $q->where('is_active', true);
                })
                ->where(function ($q) use ($query, $user) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('description', 'like', "%{$query}%");
                });

            // Apply visibility rules
            if (!$user->isSuperAdmin()) {
                $filesQuery->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('visibility', 'public')
                      ->orWhere('visibility', 'shared')
                      ->orWhereHas('shares', function ($shareQuery) use ($user) {
                          $shareQuery->where('shared_with', $user->id)
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                });
            }

            $files = $filesQuery->limit(10)->get(['id', 'name', 'mime_type', 'size', 'updated_at', 'user_id']);

            // Search folders
            $foldersQuery = Folder::with(['user:id,name'])
                ->where('name', 'like', "%{$query}%");

            if (!$user->isSuperAdmin()) {
                $foldersQuery->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('visibility', 'public')
                      ->orWhere('visibility', 'shared')
                      ->orWhereHas('shares', function ($shareQuery) use ($user) {
                          $shareQuery->where('shared_with', $user->id)
                                     ->where(function ($expireQuery) {
                                         $expireQuery->whereNull('expires_at')
                                                    ->orWhere('expires_at', '>', now());
                                     });
                      });
                });
            }

            $folders = $foldersQuery->limit(10)->get(['id', 'name', 'updated_at', 'user_id']);

            return [
                'files' => $files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'name' => $file->name,
                        'mime_type' => $file->mime_type,
                        'size' => $file->size,
                        'updated_at' => $file->updated_at->toISOString(),
                        'user' => $file->user,
                    ];
                }),
                'folders' => $folders->map(function ($folder) {
                    return [
                        'id' => $folder->id,
                        'name' => $folder->name,
                        'updated_at' => $folder->updated_at->toISOString(),
                        'user' => $folder->user,
                    ];
                }),
            ];
        });
    }
}


