# Custom Error Pages

This directory contains custom error pages for the Galunggung Drive application, all with Indonesian text.

## Available Error Pages

### 403 - Unauthorized Access
- **File**: `403.tsx`
- **Route**: `/403`
- **Description**: Displayed when a user tries to access a resource they don't have permission for
- **Features**:
  - Clear error message in Indonesian
  - Navigation buttons to go back or return to dashboard
  - Helpful suggestions for users

### 404 - Page Not Found
- **File**: `404.tsx`
- **Route**: `/404`
- **Description**: Displayed when a requested page or resource cannot be found
- **Features**:
  - Clear error message in Indonesian
  - Quick links to common pages (Files, Shared)
  - Navigation options

### 500 - Server Error
- **File**: `500.tsx`
- **Route**: `/500`
- **Description**: Displayed when an internal server error occurs
- **Features**:
  - Clear error message in Indonesian
  - Retry button to attempt the action again
  - Navigation options

## How It Works

1. **Automatic Handling**: The custom exception handler (`app/Exceptions/Handler.php`) automatically redirects to these pages when errors occur
2. **Manual Access**: You can also access these pages directly via their routes
3. **Responsive Design**: All pages are fully responsive and work on mobile devices
4. **Dark Mode Support**: All pages support dark mode

## Testing

Test routes are available (remove in production):
- `/test-403` - Triggers a 403 error
- `/test-404` - Triggers a 404 error  
- `/test-500` - Triggers a 500 error

## Customization

To modify the error pages:
1. Edit the respective `.tsx` files in this directory
2. Update the Indonesian text as needed
3. Modify the styling or layout as required
4. Test the changes using the test routes

## Indonesian Text Used

- **403**: "Akses Ditolak" (Access Denied)
- **404**: "Halaman Tidak Ditemukan" (Page Not Found)
- **500**: "Kesalahan Server" (Server Error)
- **Common phrases**: "Kembali ke Dashboard", "Kembali ke Halaman Sebelumnya", "Butuh Bantuan?"

