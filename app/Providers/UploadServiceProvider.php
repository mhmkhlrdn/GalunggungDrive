<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Config;

class UploadServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Set PHP limits for file uploads
        $this->setPhpLimits();
    }

    /**
     * Set PHP configuration limits for file uploads
     */
    private function setPhpLimits(): void
    {
        $uploadConfig = Config::get('upload', []);
        
        // Set upload limits
        if (isset($uploadConfig['max_file_size'])) {
            $maxFileSize = $uploadConfig['max_file_size'];
            if ($maxFileSize === 0) {
                // Set to a very large value instead of 0 (which might not work)
                ini_set('upload_max_filesize', '10G');
            } else {
                ini_set('upload_max_filesize', $this->formatBytes($maxFileSize));
            }
        } else {
            ini_set('upload_max_filesize', '10G');
        }
        
        if (isset($uploadConfig['max_post_size'])) {
            $maxPostSize = $uploadConfig['max_post_size'];
            if ($maxPostSize === 0) {
                ini_set('post_max_size', '10G');
            } else {
                ini_set('post_max_size', $this->formatBytes($maxPostSize));
            }
        } else {
            ini_set('post_max_size', '10G');
        }
        
        if (isset($uploadConfig['max_execution_time'])) {
            $maxExecutionTime = $uploadConfig['max_execution_time'];
            if ($maxExecutionTime === 0) {
                ini_set('max_execution_time', 0);
            } else {
                ini_set('max_execution_time', $maxExecutionTime);
            }
        } else {
            ini_set('max_execution_time', 0);
        }
        
        if (isset($uploadConfig['memory_limit'])) {
            ini_set('memory_limit', $uploadConfig['memory_limit']);
        } else {
            ini_set('memory_limit', '2G');
        }
        
        // Additional settings for large file uploads
        ini_set('max_input_time', 0);
        ini_set('max_input_vars', 10000);
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'K', 'M', 'G', 'T'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . $units[$pow];
    }
}
