<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanupExpiredSessions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up expired sessions and reset user session tracking';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting session cleanup...');

        $users = User::whereNotNull('current_session_id')->get();
        $cleanedCount = 0;

        foreach ($users as $user) {
            if (!$this->checkSessionExists($user->current_session_id)) {
                $user->update(['current_session_id' => null]);
                $cleanedCount++;
                $this->line("Cleaned up session for user: {$user->name} ({$user->email})");
            }
        }

        // Clean up expired session files
        $sessionPath = storage_path('framework/sessions');
        if (is_dir($sessionPath)) {
            $files = glob($sessionPath . '/sess_*');
            $expiredCount = 0;
            
            foreach ($files as $file) {
                if (filemtime($file) < (time() - config('session.lifetime', 120) * 60)) {
                    unlink($file);
                    $expiredCount++;
                }
            }
            
            $this->line("Cleaned up {$expiredCount} expired session files");
        }

        $this->info("Session cleanup completed. Cleaned {$cleanedCount} user sessions.");
        
        return Command::SUCCESS;
    }

    private function checkSessionExists($sessionId)
    {
        $sessionPath = storage_path('framework/sessions');
        $sessionFile = $sessionPath . '/sess_' . $sessionId;
        
        if (file_exists($sessionFile)) {
            $sessionData = file_get_contents($sessionFile);
            if ($sessionData) {
                $session = unserialize($sessionData);
                if (isset($session['_token']) && isset($session['login_web_' . sha1(User::class)])) {
                    return true;
                }
            }
        }
        
        return false;
    }
}