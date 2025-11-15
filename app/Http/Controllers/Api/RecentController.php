<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RecentController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->get('search');
        $sortBy = $request->get('sort_by', 'updated_at');
        $sortOrder = $request->get('sort_order', 'desc');

        $query = File::with(['user', 'folder', 'storageLocation'])
            ->whereHas('storageLocation', function ($q) {
                $q->where('is_active', true);
            })
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
            ->where('updated_at', '>=', now()->subDays(30));

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('tags', 'like', "%{$search}%");
            });
        }

        $files = $query->orderBy($sortBy, $sortOrder)->paginate(20);

        return response()->json([
            'status' => 'success',
            'data' => $files->items(),
            'meta' => [
                'current_page' => $files->currentPage(),
                'last_page' => $files->lastPage(),
                'per_page' => $files->perPage(),
                'total' => $files->total(),
            ],
        ]);
    }
}

