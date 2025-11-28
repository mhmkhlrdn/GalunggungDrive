<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\FolderController;
use App\Http\Controllers\Api\CloudController;
use App\Http\Controllers\Api\ShareController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TrashController;
use App\Http\Controllers\Api\RecentController;
use App\Http\Controllers\Api\StarredController;
use App\Http\Controllers\Api\StorageController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ActivityController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Recruitment file access (public API for GASNET Rekrutmen website)
Route::get('/recruitment/files/{file}/preview', [\App\Http\Controllers\Api\RecruitmentFileController::class, 'preview']);
Route::get('/recruitment/files/{file}/download', [\App\Http\Controllers\Api\RecruitmentFileController::class, 'download']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/password', [ProfileController::class, 'updatePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Files
    Route::get('/files', [FileController::class, 'index']);
    Route::post('/files', [FileController::class, 'store']);
    Route::get('/files/{file}', [FileController::class, 'show']);
    Route::put('/files/{file}', [FileController::class, 'update']);
    Route::delete('/files/{file}', [FileController::class, 'destroy']);
    Route::get('/files/{file}/download', [FileController::class, 'download']);
    Route::get('/files/{file}/preview', [FileController::class, 'preview']);
    Route::post('/files/{file}/restore', [FileController::class, 'restore']);
    Route::post('/files/{file}/move', [FileController::class, 'move']);
    Route::post('/files/{file}/toggle-star', [FileController::class, 'toggleStar']);
    Route::post('/files/batch-update', [FileController::class, 'batchUpdate']);
    Route::post('/files/batch-delete', [FileController::class, 'batchDelete']);
    Route::post('/files/batch-move', [FileController::class, 'batchMove']);

    // File Versions
    Route::get('/files/{file}/versions', [FileController::class, 'versions']);
    Route::post('/files/{file}/versions', [FileController::class, 'storeVersion']);
    Route::post('/files/{file}/versions/{version}/restore', [FileController::class, 'restoreVersion']);
    Route::get('/files/{file}/versions/{version}/download', [FileController::class, 'downloadVersion']);
    Route::delete('/files/{file}/versions/{version}', [FileController::class, 'destroyVersion']);

    // Folders
    Route::get('/folders', [FolderController::class, 'index']);
    Route::post('/folders', [FolderController::class, 'store']);
    Route::get('/folders/{folder}', [FolderController::class, 'show']);
    Route::put('/folders/{folder}', [FolderController::class, 'update']);
    Route::delete('/folders/{folder}', [FolderController::class, 'destroy']);
    Route::get('/folders/{folder}/download', [FolderController::class, 'download']);
    Route::post('/folders/{folder}/restore', [FolderController::class, 'restore']);
    Route::delete('/folders/{folder}/empty', [FolderController::class, 'emptyFolder']);

    // Cloud
    Route::get('/cloud', [CloudController::class, 'index']);
    Route::get('/cloud/search', [CloudController::class, 'search']);

    // Shares
    Route::get('/shares', [ShareController::class, 'index']);
    Route::post('/files/{file}/share', [ShareController::class, 'shareFile']);
    Route::post('/folders/{folder}/share', [ShareController::class, 'shareFolder']);
    Route::put('/file-shares/{fileShare}', [ShareController::class, 'updateFileShare']);
    Route::delete('/file-shares/{fileShare}', [ShareController::class, 'destroyFileShare']);
    Route::put('/folder-shares/{folderShare}', [ShareController::class, 'updateFolderShare']);
    Route::delete('/folder-shares/{folderShare}', [ShareController::class, 'destroyFolderShare']);
    Route::get('/files/{file}/shares', [ShareController::class, 'getFileShares']);
    Route::post('/files/shares', [ShareController::class, 'getExistingShares']);

    // Recent files
    Route::get('/recent', [RecentController::class, 'index']);

    // Starred files
    Route::get('/starred', [StarredController::class, 'index']);

    // Trash
    Route::get('/trash', [TrashController::class, 'index']);
    Route::post('/trash/empty', [TrashController::class, 'empty']);
    Route::post('/trash/files/{file}/restore', [TrashController::class, 'restoreFile']);
    Route::delete('/trash/files/{file}/force', [TrashController::class, 'destroyFilePermanently']);
    Route::post('/trash/folders/{folder}/restore', [TrashController::class, 'restoreFolder']);
    Route::delete('/trash/folders/{folder}/force', [TrashController::class, 'destroyFolderPermanently']);

    // Storage
    Route::get('/storage', [StorageController::class, 'index']);

        // Activity (admin only)
        Route::middleware('admin')->group(function () {
            Route::get('/activity', [ActivityController::class, 'index']);
            Route::post('/activity/clear', [ActivityController::class, 'clear']);
        });

        // Users (admin only)
        Route::middleware('admin')->group(function () {
            Route::get('/users', [\App\Http\Controllers\Api\UserController::class, 'index']);
            Route::post('/users', [\App\Http\Controllers\Api\UserController::class, 'store']);
            Route::get('/users/{user}', [\App\Http\Controllers\Api\UserController::class, 'show']);
            Route::put('/users/{user}', [\App\Http\Controllers\Api\UserController::class, 'update']);
            Route::delete('/users/{user}', [\App\Http\Controllers\Api\UserController::class, 'destroy']);
            Route::post('/users/{user}/toggle-approval', [\App\Http\Controllers\Api\UserController::class, 'toggleApproval']);
        });
    });

