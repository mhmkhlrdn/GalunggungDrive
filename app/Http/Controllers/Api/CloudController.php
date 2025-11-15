<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\Folder;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use App\Services\CacheService;

class CloudController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        /** @var User $user */
        $userId = $user->id;
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'updated_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $cacheKey = CacheService::getCloudCacheKey($user);
        $cacheKey .= '_api_' . md5($search . $sortBy . $sortOrder);

        $cachedData = Cache::remember($cacheKey, 300, function () use ($userId, $user, $search, $sortBy, $sortOrder) {
            return $this->getCloudData($userId, $user, $search, $sortBy, $sortOrder);
        });

        return response()->json([
            'status' => 'success',
            'data' => $cachedData,
        ]);
    }

    public function search(Request $request)
    {
        $user = Auth::user();
        $search = $request->get('q', '');

        if (empty($search)) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'folders' => [],
                    'files' => [],
                ],
            ]);
        }

        $userId = $user->id;
        $folders = $this->searchFolders($userId, $user, $search);
        $files = $this->searchFiles($userId, $user, $search);

        return response()->json([
            'status' => 'success',
            'data' => [
                'folders' => $folders,
                'files' => $files,
            ],
        ]);
    }

    private function getCloudData(int $userId, User $user, ?string $search, string $sortBy, string $sortOrder): array
    {
        $folders = $this->getOptimizedFolders($userId, $user, $search);
        $files = $this->getOptimizedFiles($userId, $user, $search, $sortBy, $sortOrder);

        return [
            'folders' => $folders,
            'files' => $files,
        ];
    }

    private function getOptimizedFolders(int $userId, User $user, ?string $search): array
    {
        $query = Folder::with(['user:id,name'])
            ->whereNull('parent_id')
            ->select(['id', 'name', 'parent_id', 'user_id', 'updated_at', 'visibility']);

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

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $folders = $query->orderBy('name')->get();

        return $folders->map(function ($folder) {
            $filesCount = File::where('folder_id', $folder->id)
                ->whereHas('storageLocation', function ($q) {
                    $q->where('is_active', true);
                })
                ->count();

            return [
                'id' => $folder->id,
                'name' => $folder->name,
                'parent_id' => $folder->parent_id,
                'visibility' => $folder->visibility,
                'updated_at' => $folder->updated_at->toISOString(),
                'user' => [
                    'id' => $folder->user->id,
                    'name' => $folder->user->name,
                ],
                'files_count' => $filesCount,
            ];
        })->toArray();
    }

    private function getOptimizedFiles(int $userId, User $user, ?string $search, string $sortBy, string $sortOrder): array
    {
        $query = File::with(['user:id,name', 'storageLocation:id,name,is_active'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
            ->whereNull('folder_id')
            ->select(['id', 'name', 'size', 'mime_type', 'updated_at', 'visibility', 'user_id', 'disk_id', 'description', 'tags']);

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

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        $files = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        $files->getCollection()->transform(function ($file) use ($user) {
            $file->starred = $file->isStarredBy($user);
            return $file;
        });

        return [
            'data' => $files->getCollection()->map(function ($file) {
                return [
                    'id' => $file->id,
                    'name' => $file->name,
                    'size' => $file->size,
                    'mime_type' => $file->mime_type,
                    'description' => $file->description,
                    'tags' => $file->tags,
                    'visibility' => $file->visibility,
                    'starred' => $file->starred ?? false,
                    'folder_id' => $file->folder_id,
                    'updated_at' => $file->updated_at->toISOString(),
                    'user' => [
                        'id' => $file->user->id,
                        'name' => $file->user->name,
                    ],
                    'storage_location' => $file->storageLocation ? [
                        'id' => $file->storageLocation->id,
                        'name' => $file->storageLocation->name,
                    ] : null,
                ];
            })->toArray(),
            'meta' => [
                'current_page' => $files->currentPage(),
                'last_page' => $files->lastPage(),
                'per_page' => $files->perPage(),
                'total' => $files->total(),
            ],
        ];
    }

    private function searchFolders(int $userId, User $user, string $search): array
    {
        $query = Folder::with(['user:id,name'])
            ->whereNull('parent_id')
            ->where('name', 'like', "%{$search}%")
            ->select(['id', 'name', 'parent_id', 'user_id', 'updated_at', 'visibility']);

        if (!$user->isSuperAdmin()) {
            if ($user->isAdmin()) {
                $query->where(function ($q) use ($userId) {
                    $q->where('user_id', $userId)
                      ->orWhere('visibility', 'public')
                      ->orWhere('visibility', 'shared')
                      ->orWhereHas('shares', function ($shareQuery) use ($userId) {
                          $shareQuery->where('shared_with', $userId);
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
                          $shareQuery->where('shared_with', $userId);
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

    private function searchFiles(int $userId, User $user, string $search): array
    {
        $query = File::with(['user:id,name', 'folder:id,name'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            })
            ->select(['id', 'name', 'size', 'mime_type', 'updated_at', 'visibility', 'user_id', 'folder_id']);

        if (!$user->isSuperAdmin()) {
            if ($user->isAdmin()) {
                $query->where(function ($q) use ($userId) {
                    $q->where('user_id', $userId)
                      ->orWhere('visibility', 'public')
                      ->orWhere('visibility', 'shared')
                      ->orWhereHas('shares', function ($shareQuery) use ($userId) {
                          $shareQuery->where('shared_with', $userId);
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
                          $shareQuery->where('shared_with', $userId);
                      });
                });
            }
        }

        $files = $query->orderBy('updated_at', 'desc')->limit(50)->get();

        $files->transform(function ($file) use ($user) {
            $file->starred = $file->isStarredBy($user);
            return $file;
        });

        return $files->map(function ($file) {
            return [
                'id' => $file->id,
                'name' => $file->name,
                'size' => $file->size,
                'mime_type' => $file->mime_type,
                'visibility' => $file->visibility,
                'starred' => $file->starred ?? false,
                'folder_id' => $file->folder_id,
                'folder' => $file->folder ? [
                    'id' => $file->folder->id,
                    'name' => $file->folder->name,
                ] : null,
                'updated_at' => $file->updated_at->toISOString(),
                'user' => [
                    'id' => $file->user->id,
                    'name' => $file->user->name,
                ],
            ];
        })->toArray();
    }
}

