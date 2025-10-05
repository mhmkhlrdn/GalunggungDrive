<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $settings = [
            'site_name' => Setting::getSiteName(),
            'maintenance_mode' => Setting::isMaintenanceMode(),
            'logo_url' => Setting::getLogoUrl(),
            'favicon_url' => Setting::getFaviconUrl(),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'site_name' => 'required|string|max:255',
            'maintenance_mode' => 'boolean',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'favicon' => 'nullable|image|mimes:ico,png,jpg,jpeg|max:512',
        ]);

        // Update site name in database
        Setting::set('site_name', $validated['site_name'], 'string', 'Nama situs web');

        // Handle maintenance mode
        if ($validated['maintenance_mode']) {
            Setting::enableMaintenanceMode();
        } else {
            Setting::disableMaintenanceMode();
        }

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $this->handleLogoUpload($request->file('logo'));
        }

        // Handle favicon upload
        if ($request->hasFile('favicon')) {
            $this->handleFaviconUpload($request->file('favicon'));
        }

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }



    private function handleLogoUpload($file): void
    {
        // Delete old logo
        $this->deleteOldLogo();

        // Store new logo
        $filename = 'logo.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('public/logos', $filename);

        // Update database with new logo filename
        Setting::set('logo_filename', $filename, 'string', 'Nama file logo situs');
    }

    private function handleFaviconUpload($file): void
    {
        // Delete old favicon
        $this->deleteOldFavicon();

        // Store new favicon
        $filename = 'favicon.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('public/logos', $filename);

        // Update database with new favicon filename
        Setting::set('favicon_filename', $filename, 'string', 'Nama file favicon situs');
    }

    private function deleteOldLogo(): void
    {
        $logoPath = public_path('storage/logos/logo.*');
        $files = glob($logoPath);

        foreach ($files as $file) {
            if (file_exists($file)) {
                unlink($file);
            }
        }
    }

    private function deleteOldFavicon(): void
    {
        $faviconPath = public_path('storage/logos/favicon.*');
        $files = glob($faviconPath);

        foreach ($files as $file) {
            if (file_exists($file)) {
                unlink($file);
            }
        }
    }

}
