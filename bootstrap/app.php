<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            // Add maintenance mode check to web middleware group, after authentication
            \App\Http\Middleware\CheckMaintenanceMode::class,
            // Add performance monitoring
            \App\Http\Middleware\PerformanceMonitoring::class,
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'check.session' => \App\Http\Middleware\CheckActiveSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (Throwable $e, $request) {
            if ($e instanceof HttpException) {
                $status = $e->getStatusCode();

                // Check if the request expects JSON
                if ($request->expectsJson()) {
                    $message = $e->getMessage() ?: match ($status) {
                        403 => 'Akses Ditolak',
                        404 => 'Halaman Tidak Ditemukan',
                        500 => 'Kesalahan Server',
                        default => 'Terjadi Kesalahan'
                    };
                    return response()->json([
                        'message' => $message,
                        'status' => $status
                    ], $status);
                }

                // Render custom error pages for web requests
                switch ($status) {
                    case 403:
                        return Inertia::render('errors/403')->toResponse($request)->setStatusCode(403);
                    case 404:
                        return Inertia::render('errors/404')->toResponse($request)->setStatusCode(404);
                    case 500:
                        $errorMessage = $e->getMessage() ?: 'Kesalahan Server Internal';
                        return Inertia::render('errors/500', ['message' => $errorMessage])->toResponse($request)->setStatusCode(500);
                    default:
                        return null; // Let Laravel handle other cases
                }
            }

            // Handle other exceptions
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Server Error',
                    'status' => 500
                ], 500);
            }

            // For web requests, render the 500 error page with a generic message
            return Inertia::render('errors/500', ['message' => 'Terjadi kesalahan server yang tidak terduga.'])->toResponse($request)->setStatusCode(500);
        });
    })->create();
