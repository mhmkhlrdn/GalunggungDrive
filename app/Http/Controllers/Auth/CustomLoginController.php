<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class CustomLoginController extends Controller
{
    public function showLoginForm()
    {
        return Inertia::render('auth/login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return back()->withErrors([
                'email' => 'Kredensial yang diberikan tidak cocok dengan catatan kami.',
            ]);
        }

        // Check if user is already logged in elsewhere
        if ($user->current_session_id && $user->current_session_id !== session()->getId()) {
            // Check if the session still exists
            $sessionExists = $this->checkSessionExists($user->current_session_id);

            if ($sessionExists) {
                return Inertia::render('auth/LoginBlocked', [
                    'message' => 'Akun ini sedang digunakan di perangkat lain. Silakan tunggu hingga pengguna lain keluar atau hubungi administrator.',
                    'lastLoginAt' => $user->last_login_at,
                    'lastLoginIp' => $user->last_login_ip,
                ]);
            } else {
                // Session doesn't exist, clear the session ID
                $user->update(['current_session_id' => null]);
            }
        }

        // Generate new session ID
        $sessionId = session()->getId();

        // Update user with new session info
        $user->update([
            'current_session_id' => $sessionId,
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Log the user in
        Auth::login($user, $request->boolean('remember'));

        $request->session()->regenerate();

        return redirect()->intended('/dashboard');
    }

    public function logout(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            // Clear session tracking
            $user->update(['current_session_id' => null]);
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
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

    public function forceLogout(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return back()->withErrors([
                'email' => 'Kredensial yang diberikan tidak cocok dengan catatan kami.',
            ]);
        }

        // Force logout by clearing session
        $user->update(['current_session_id' => null]);

        // Generate new session ID
        $sessionId = session()->getId();

        // Update user with new session info
        $user->update([
            'current_session_id' => $sessionId,
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Log the user in
        Auth::login($user, $request->boolean('remember'));

        $request->session()->regenerate();

        return redirect()->intended('/dashboard');
    }
}
