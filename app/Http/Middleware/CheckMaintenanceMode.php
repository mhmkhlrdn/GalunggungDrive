<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if maintenance mode is enabled in database
        $databaseMaintenance = Setting::isMaintenanceMode();

        if ($databaseMaintenance) {
            // Allow authenticated admin users full access during maintenance
            if ($request->user() && in_array($request->user()->role, ['admin', 'super-admin'])) {
                return $next($request);
            }

            // For non-admin users, always allow access to login, register, and password reset pages
            if ($request->is('/') || $request->is('login') || $request->is('register') || $request->is('password/*')) {
                return $next($request);
            }

            // For regular users, show maintenance page
            // If it's an Inertia request, return the maintenance page
            if ($request->header('X-Inertia')) {
                return Inertia::render('Maintenance')->toResponse($request);
            }

            // For non-Inertia requests, return a simple HTML response
            return response()->view('maintenance', [], 503);
        }

        return $next($request);
    }
}
