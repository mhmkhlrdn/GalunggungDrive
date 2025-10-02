<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Folder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RecentController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'updated_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $query = File::with(['user', 'folder'])
            ->where(function ($q) {
                $q->where('user_id', Auth::id())
                  ->orWhere('visibility', 'public')
                  ->orWhereHas('shares', function ($shareQuery) {
                      $shareQuery->where('shared_with', Auth::id())
                                 ->where(function ($expireQuery) {
                                     $expireQuery->whereNull('expires_at')
                                                ->orWhere('expires_at', '>', now());
                                 });
                  });
            })
            ->where('updated_at', '>=', now()->subDays(30)); // Last 30 days

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        $files = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        return Inertia::render('Recent/Index', [
            'files' => $files,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }
}
