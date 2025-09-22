# File Upload Limits Configuration Guide

This guide explains how to remove file size limits for unlimited file uploads in your Laravel application.

## Current Issue
You're experiencing `PostTooLargeException` when uploading files because PHP has restrictive default limits:
- `upload_max_filesize: 2M` (only 2MB per file)
- `post_max_size: 8M` (only 8MB total POST data)
- `memory_limit: 128M` (128MB memory limit)

## Solutions Implemented

### 1. Laravel Service Provider (Automatic)
✅ **Already implemented** - `app/Providers/UploadServiceProvider.php`
- Automatically sets PHP limits when the application starts
- Uses configuration from `config/upload.php`
- No manual intervention required

### 2. Configuration File
✅ **Already created** - `config/upload.php`
- Centralized configuration for upload settings
- Allows customization of file types, storage paths, etc.
- Set `max_file_size: 0` for unlimited uploads

### 3. .htaccess File
✅ **Already created** - `.htaccess`
- Sets PHP limits via web server configuration
- May require web server restart to take effect

### 4. PHP.ini File (Recommended for Herd)
🔧 **Manual step required** - Run the update script

## How to Apply the Changes

### For Laravel Herd Users (Recommended)

1. **Run the PHP limits update script:**
   ```bash
   php update-php-limits.php
   ```

2. **Restart Laravel Herd:**
   - Close and reopen Laravel Herd
   - Or restart the Herd service

3. **Verify the changes:**
   ```bash
   php test-upload-limits.php
   ```

### For Other Web Servers

#### Apache
1. Ensure `.htaccess` file is in your project root
2. Restart Apache server
3. Verify with test script

#### Nginx
1. Add these directives to your nginx configuration:
   ```nginx
   client_max_body_size 10G;
   fastcgi_read_timeout 3600;
   ```
2. Restart Nginx

#### PHP-FPM
1. Update php.ini file directly
2. Restart PHP-FPM service

## Verification

After applying changes, run the test script to verify:
```bash
php test-upload-limits.php
```

You should see:
- `upload_max_filesize: 10G` (or similar large value)
- `post_max_size: 10G` (or similar large value)
- `memory_limit: 2G`

## Testing File Upload

1. Try uploading a file larger than the previous limits
2. If successful, the configuration is working
3. If you still get `PostTooLargeException`, check:
   - Web server configuration
   - PHP-FPM settings
   - Cloudflare or CDN limits (if applicable)

## Troubleshooting

### Still Getting PostTooLargeException?

1. **Check web server logs** for additional error details
2. **Verify .htaccess is being read** by adding a test directive
3. **Check if you're behind a proxy** (Cloudflare, etc.) that has its own limits
4. **Try the manual php.ini update** if using Herd

### Alternative: Chunked Upload

If you still have issues, consider implementing chunked file uploads for very large files:
- Split large files into smaller chunks
- Upload chunks sequentially
- Reassemble on the server

## Security Considerations

⚠️ **Important Security Notes:**

1. **File Type Validation**: The configuration includes allowed MIME types
2. **Virus Scanning**: Consider implementing malware scanning for uploaded files
3. **Storage Limits**: Monitor disk space usage
4. **User Quotas**: Consider implementing per-user storage limits
5. **Access Control**: Ensure proper file permissions and access controls

## Configuration Options

Edit `config/upload.php` to customize:

```php
'max_file_size' => 0, // 0 = unlimited, or specify in bytes
'allowed_mime_types' => [...], // Restrict file types if needed
'storage_disk' => 'private', // Storage disk to use
'scan_uploads' => true, // Enable virus scanning if available
```

## Support

If you continue to experience issues:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Check web server error logs
3. Verify PHP configuration with `phpinfo()`
4. Test with a simple PHP upload script outside of Laravel
