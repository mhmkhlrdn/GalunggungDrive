<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PerformanceMonitoring
{
    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage(true);

        $response = $next($request);

        $endTime = microtime(true);
        $endMemory = memory_get_usage(true);

        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds
        $memoryUsage = $endMemory - $startMemory;
        $peakMemory = memory_get_peak_usage(true);

        // Log slow requests
        if ($executionTime > 1000) { // More than 1 second
            Log::warning('Slow request detected', [
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'execution_time_ms' => round($executionTime, 2),
                'memory_usage_mb' => round($memoryUsage / 1024 / 1024, 2),
                'peak_memory_mb' => round($peakMemory / 1024 / 1024, 2),
                'user_id' => auth()->id(),
            ]);
        }

        // Add performance headers
        $response->headers->set('X-Execution-Time', round($executionTime, 2) . 'ms');
        $response->headers->set('X-Memory-Usage', round($memoryUsage / 1024 / 1024, 2) . 'MB');
        $response->headers->set('X-Peak-Memory', round($peakMemory / 1024 / 1024, 2) . 'MB');

        // Cache performance metrics
        $cacheKey = 'performance_metrics_' . date('Y-m-d-H');
        $metrics = Cache::get($cacheKey, [
            'total_requests' => 0,
            'total_time' => 0,
            'slow_requests' => 0,
            'avg_time' => 0,
        ]);

        $metrics['total_requests']++;
        $metrics['total_time'] += $executionTime;
        if ($executionTime > 1000) {
            $metrics['slow_requests']++;
        }
        $metrics['avg_time'] = $metrics['total_time'] / $metrics['total_requests'];

        Cache::put($cacheKey, $metrics, 3600); // Cache for 1 hour

        return $response;
    }
}
