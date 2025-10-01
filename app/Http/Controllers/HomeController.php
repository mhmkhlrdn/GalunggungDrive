<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = auth()->id();
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'updated_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $filesQuery = File::with(['folder'])
            ->where('user_id', $userId);
        if ($search) {
            $filesQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }
        $files = $filesQuery->orderBy($sortBy, $sortOrder)->paginate(20);

        // Add starred status to each file
        $files->getCollection()->transform(function ($file) {
            $file->starred = $file->isStarredBy(auth()->user());
            return $file;
        });

        $foldersQuery = Folder::query()->where('user_id', $userId);
        if ($search) {
            $foldersQuery->where('name', 'like', "%{$search}%");
        }
        $folders = $foldersQuery->orderBy($sortBy, $sortOrder)->paginate(20);

        return Inertia::render('home/index', [
            'files' => $files,
            'folders' => $folders,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }
}


