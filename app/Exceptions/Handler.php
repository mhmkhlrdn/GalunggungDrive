<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * Report or log an exception.
     */
    public function report(Throwable $e): void
    {
        parent::report($e);
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        $status = $this->isHttpException($e)
            ? ($e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500)
            : 500;

        if ($status === 500) {
            $errorId = (string) Str::uuid();

            $this->logDetailed($request, $e, $errorId);

            // Inertia friendly 500 page
            if ($request instanceof Request && $request->header('X-Inertia')) {
                return Inertia::render('errors/500', [
                    'message' => config('app.debug') ? $e->getMessage() : 'Maaf, terjadi kesalahan internal pada server.',
                    'errorId' => $errorId,
                ])->toResponse($request)->setStatusCode(500);
            }
        }

        return parent::render($request, $e);
    }

    private function logDetailed(Request $request, Throwable $e, string $errorId): void
    {
        try {
            $user = $request->user();
            Log::error('Unhandled exception', [
                'error_id' => $errorId,
                'message' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => collect($e->getTrace())->take(20),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'user_id' => $user?->id,
                'payload' => $request->except(['password', 'password_confirmation', 'token']),
            ]);
        } catch (Throwable $_) {
            // Swallow any logging exceptions to avoid masking original error
        }
    }
}


