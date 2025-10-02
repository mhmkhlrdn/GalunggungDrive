<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Inertia\Inertia;
use Inertia\Response;

class CloudController extends Controller
{
    public function index(): Response
    {
        $userId = auth()->id();


        $folders = Folder::query()
            ->whereNull('parent_id')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhere('visibility', 'public')
                  ->orWhereHas('shares', function ($shareQuery) use ($userId) {
                      $shareQuery->where('shared_with', $userId)
                                 ->where(function ($expireQuery) {
                                     $expireQuery->whereNull('expires_at')
                                                ->orWhere('expires_at', '>', now());
                                 });
                  });
            })
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id', 'updated_at']);


        $files = File::query()
            ->whereNull('folder_id')
            ->where(function ($q) use ($userId) {
                $q->where('user_id', $userId)
                  ->orWhere('visibility', 'public')
                  ->orWhereHas('shares', function ($shareQuery) use ($userId) {
                      $shareQuery->where('shared_with', $userId)
                                 ->where(function ($expireQuery) {
                                     $expireQuery->whereNull('expires_at')
                                                ->orWhere('expires_at', '>', now());
                                 });
                  });
            })
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        return Inertia::render('Cloud/Index', [
            'folders' => $folders->map(function ($f) {
                return [
                    'id' => $f->id,
                    'name' => $f->name,
                    'updated_at' => $f->updated_at->toISOString(),
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
                        'starred' => $file->isStarredBy(auth()->user()),
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
        ]);
    }
}


