<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\CloudController;
use App\Http\Controllers\StorageController;
use App\Http\Controllers\RecentController;
use App\Http\Controllers\StarredController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\TrashController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Public file access routes (no authentication required)
Route::get('public/file/{token}', [App\Http\Controllers\FileShareController::class, 'publicAccess'])->name('public.file');
Route::get('public/file/{token}/download', [App\Http\Controllers\FileShareController::class, 'publicDownload'])->name('public.file.download');
Route::get('public/folder/{token}', [App\Http\Controllers\FolderShareController::class, 'publicAccess'])->name('public.folder');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        // File Management Routes
        Route::resource('files', FileController::class);
        Route::get('files/{file}/download', [FileController::class, 'download'])->name('files.download');
        Route::get('files/{file}/preview', [FileController::class, 'preview'])->name('files.preview');
        Route::post('files/{file}/restore', [FileController::class, 'restore'])->name('files.restore');
        Route::post('files/{file}/move', [FileController::class, 'move'])->name('files.move');

        // File Sharing Routes
        Route::get('files/{file}/share', [App\Http\Controllers\FileShareController::class, 'create'])->name('files.share');
        Route::post('files/{file}/share', [App\Http\Controllers\FileShareController::class, 'store'])->name('files.share.store');
        Route::put('file-shares/{fileShare}', [App\Http\Controllers\FileShareController::class, 'update'])->name('file-shares.update');
        Route::delete('file-shares/{fileShare}', [App\Http\Controllers\FileShareController::class, 'destroy'])->name('file-shares.destroy');

        // File Version Routes
        Route::get('files/{file}/versions', [App\Http\Controllers\FileVersionController::class, 'index'])->name('files.versions');
        Route::post('files/{file}/versions', [App\Http\Controllers\FileVersionController::class, 'store'])->name('files.versions.store');
        Route::post('files/{file}/versions/{version}/restore', [App\Http\Controllers\FileVersionController::class, 'restore'])->name('files.versions.restore');
        Route::get('files/{file}/versions/{version}/download', [App\Http\Controllers\FileVersionController::class, 'download'])->name('files.versions.download');
        Route::delete('files/{file}/versions/{version}', [App\Http\Controllers\FileVersionController::class, 'destroy'])->name('files.versions.destroy');

        // Folder Management Routes
        Route::resource('folders', FolderController::class);
        Route::post('folders/{folder}/restore', [FolderController::class, 'restore'])->name('folders.restore');
        Route::get('folders/{folder}/download', [FolderController::class, 'download'])->name('folders.download');
        // Encrypted folder view route
        Route::get('f/{token}', [FolderController::class, 'view'])->name('folders.view');

        // Folder Sharing Routes
        Route::get('folders/{folder}/share', [App\Http\Controllers\FolderShareController::class, 'create'])->name('folders.share');
        Route::post('folders/{folder}/share', [App\Http\Controllers\FolderShareController::class, 'store'])->name('folders.share.store');
        Route::put('folder-shares/{folderShare}', [App\Http\Controllers\FolderShareController::class, 'update'])->name('folder-shares.update');
        Route::delete('folder-shares/{folderShare}', [App\Http\Controllers\FolderShareController::class, 'destroy'])->name('folder-shares.destroy');

    // Shared Files Routes
    Route::get('shared', [App\Http\Controllers\FileShareController::class, 'index'])->name('shared.index');
    Route::get('shares', function () {
        return redirect()->route('shared.index');
    })->name('shares.redirect');

    // Recent Files Route
    Route::get('recent', [RecentController::class, 'index'])->name('recent.index');

    // Starred Files Route
    Route::get('starred', [StarredController::class, 'index'])->name('starred.index');

    // Storage Management Route
    Route::get('storage', [StorageController::class, 'index'])->name('storage.index');

    // Cloud (All Files and Folders) Route
    Route::get('cloud', [CloudController::class, 'index'])->name('cloud.index');

    // Activity Log Route
    Route::get('activity', [ActivityController::class, 'index'])->name('activity.index');

    // Trash Route
    Route::get('trash', [TrashController::class, 'index'])->name('trash.index');
    Route::post('trash/empty', [TrashController::class, 'empty'])->name('trash.empty');
    Route::post('trash/files/{file}/restore', [TrashController::class, 'restoreFile'])->name('trash.files.restore');
    Route::delete('trash/files/{file}/force', [TrashController::class, 'destroyFilePermanently'])->name('trash.files.force');
    Route::post('trash/folders/{folder}/restore', [TrashController::class, 'restoreFolder'])->name('trash.folders.restore');
    Route::delete('trash/folders/{folder}/force', [TrashController::class, 'destroyFolderPermanently'])->name('trash.folders.force');

    // Admin Routes
    Route::middleware('admin')->prefix('admin')->name('admin.')->group(function () {
        Route::resource('storage-locations', \App\Http\Controllers\Admin\StorageLocationController::class);
        Route::post('storage-locations/{storageLocation}/toggle', [\App\Http\Controllers\Admin\StorageLocationController::class, 'toggle'])->name('storage-locations.toggle');
        
        Route::resource('users', \App\Http\Controllers\Admin\UserController::class);
        Route::post('users/{user}/toggle-status', [\App\Http\Controllers\Admin\UserController::class, 'toggleStatus'])->name('users.toggle-status');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
