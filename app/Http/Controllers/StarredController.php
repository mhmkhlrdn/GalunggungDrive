<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StarredController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'updated_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $query = File::with(['user', 'folder', 'storageLocation'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereHas('shares', function ($shareQuery) use ($user) {
                      $shareQuery->where('shared_with', $user->id);
                  });
            })
            ->whereHas('starredBy', function ($starQuery) use ($user) {
                $starQuery->where('user_id', $user->id);
            });

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        $files = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        // Get all users for sharing functionality
        $users = \App\Models\User::where('id', '!=', $user->id)
            ->select('id', 'name', 'email')
            ->get();

        return Inertia::render('starred/index', [
            'files' => $files,
            'users' => $users,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }
}
