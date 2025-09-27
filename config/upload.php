<?php

return [
    /*
    |--------------------------------------------------------------------------
    | File Upload Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for file upload limits and settings.
    | Set to 0 for unlimited file size.
    |
    */

    'max_file_size' => 0, // 0 = unlimited, or specify in bytes (e.g., 1073741824 for 1GB)
    'max_post_size' => 0, // 0 = unlimited, or specify in bytes
    'max_execution_time' => 0, // 0 = unlimited, or specify in seconds
    'memory_limit' => '2G', // Memory limit for processing large files
    
    /*
    |--------------------------------------------------------------------------
    | Allowed File Types
    |--------------------------------------------------------------------------
    |
    | Define allowed MIME types for file uploads.
    | Leave empty array to allow all file types.
    |
    */
    
    'allowed_mime_types' => [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        
        // Archives
        'application/zip',
        'application/x-zip-compressed',
        'application/x-compressed-zip',
        'application/x-rar-compressed',
        'application/vnd.rar',
        'application/x-7z-compressed',
        'application/gzip',
        
        // Videos
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/webm',
        
        // Audio
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/mpeg',
        
        // Code files
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/json',
        'application/xml',
        'text/xml',
        
        // Add more as needed, or leave empty to allow all
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    |
    | Storage disk and path configuration for uploaded files.
    |
    */
    
    'storage_disk' => 'private',
    'storage_path' => 'files',
    
    /*
    |--------------------------------------------------------------------------
    | Security Settings
    |--------------------------------------------------------------------------
    |
    | Security-related settings for file uploads.
    |
    */
    
    'scan_uploads' => true, // Scan uploaded files for malware (if available)
    'generate_checksum' => true, // Generate SHA256 checksum for uploaded files
    'create_versions' => true, // Create version history for files
];
