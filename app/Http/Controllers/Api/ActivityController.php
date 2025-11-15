<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = ActivityLog::with(['user:id,name,email'])
            ->orderBy('created_at', 'desc');

        // Non-admins can only see their own activity
        if (!$user->isSuperAdmin() && !$user->isAdmin()) {
            $query->where('user_id', $user->id);
        }

        // Filter by action if provided
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        // Filter by date if provided
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $activities = $query->paginate(50);

        return response()->json([
            'status' => 'success',
            'data' => $activities->items(),
            'meta' => [
                'current_page' => $activities->currentPage(),
                'last_page' => $activities->lastPage(),
                'per_page' => $activities->perPage(),
                'total' => $activities->total(),
            ],
        ]);
    }

    public function clear(Request $request)
    {
        $user = Auth::user();

        // Only admins can clear all activity, others can only clear their own
        if ($user->isSuperAdmin() || $user->isAdmin()) {
            ActivityLog::truncate();
        } else {
            ActivityLog::where('user_id', $user->id)->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Activity logs cleared successfully',
        ]);
    }
}

