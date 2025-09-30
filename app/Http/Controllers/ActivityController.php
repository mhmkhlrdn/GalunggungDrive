<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $search = $request->get('search');
        $action = $request->get('action');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $query = ActivityLog::where('success', 1);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhereJsonContains('details->file_name', $search);
            });
        }

        if ($action) {
            $query->where('action', $action);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $activities = $query->with('user')->orderBy('created_at', 'desc')->paginate(20);

        // Get available actions for filter
        $availableActions = ActivityLog::where('user_id', $user->id)
            ->distinct()
            ->pluck('action')
            ->sort()
            ->values();

        return Inertia::render('activity/index', [
            'activities' => $activities,
            'availableActions' => $availableActions,
            'filters' => [
                'search' => $search,
                'action' => $action,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }
}
