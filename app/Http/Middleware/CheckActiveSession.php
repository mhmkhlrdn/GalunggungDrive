<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckActiveSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $currentSessionId = session()->getId();
            
            // Check if the user's current session ID matches the current session
            if ($user->current_session_id && $user->current_session_id !== $currentSessionId) {
                // Check if the stored session still exists
                if (!$this->checkSessionExists($user->current_session_id)) {
                    // Session doesn't exist, clear the session ID
                    $user->update(['current_session_id' => null]);
                } else {
                    // Another session is active, log out the current user
                    Auth::logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                    
                    return redirect()->route('login')->with('error', 'Akun Anda sedang digunakan di perangkat lain. Anda telah keluar dari sesi ini.');
                }
            }
        }

        return $next($request);
    }

    private function checkSessionExists($sessionId)
    {
        // Check if the session file exists in the session storage
        $sessionPath = storage_path('framework/sessions');
        $sessionFile = $sessionPath . '/sess_' . $sessionId;
        
        if (file_exists($sessionFile)) {
            // Check if session is not expired
            $sessionData = file_get_contents($sessionFile);
            if ($sessionData) {
                // Parse session data to check if it's still valid
                $session = unserialize($sessionData);
                if (isset($session['_token']) && isset($session['login_web_' . sha1(User::class)])) {
                    return true;
                }
            }
        }
        
        return false;
    }
}