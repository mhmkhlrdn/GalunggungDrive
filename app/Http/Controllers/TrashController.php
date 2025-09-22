<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrashController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $search = $request->get('search');
        $type = $request->get('type', 'all'); // all, files, folders
        $sortBy = $request->get('sort_by', 'deleted_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        $filesQuery = File::onlyTrashed()
            ->where('user_id', $user->id)
            ->with(['user', 'folder']);
            
        $foldersQuery = Folder::onlyTrashed()
            ->where('user_id', $user->id);
        
        if ($search) {
            $filesQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
            
            $foldersQuery->where('name', 'like', "%{$search}%");
        }
        
        $files = null;
        $folders = null;
        
        if ($type === 'all' || $type === 'files') {
            $files = $filesQuery->orderBy($sortBy, $sortOrder)->paginate(20);
        }
        
        if ($type === 'all' || $type === 'folders') {
            $folders = $foldersQuery->orderBy($sortBy, $sortOrder)->paginate(20);
        }
        
        return Inertia::render('trash/index', [
            'files' => $files,
            'folders' => $folders,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }
}
