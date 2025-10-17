<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Inertia\Response;

class ActivityController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $search = $request->get('search');
        $action = $request->get('action');
        $actor = $request->get('actor');
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

        if ($actor) {
            $query->where('user_id', $actor);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $activities = $query->with('user')->orderBy('created_at', 'desc')->paginate(20);


        $availableActions = ActivityLog::distinct()
    ->pluck('action')
    ->sort()
    ->values();
        $allActors = ActivityLog::distinct()
            ->with('user')
            ->get()
            ->map(function ($log) {
                return $log->user;
            })
            ->unique('id')
            ->sortBy('name')
            ->values();

        return Inertia::render('activity/index', [
            'activities' => $activities,
            'availableActions' => $availableActions,
            'filters' => [
                'search' => $search,
                'action' => $action,
                'actor' => $actor,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'allActors' => $allActors
        ]);
    }

    public function clear(Request $request){
        $user = Auth::user();
        if($user->role === 'super-admin'){
            try {
            ActivityLog::truncate();
            return redirect()->back()->with('success', 'Activity log cleared successfully.');
            } catch (\Exception $e) {
                return redirect()->back()->with('error', 'An error occurred while clearing the activity log.');
            }
    }

    ;
}
}
