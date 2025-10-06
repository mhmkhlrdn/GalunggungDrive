<?php

namespace App\Policies;

use App\Models\File;
use App\Models\User;

class FilePolicy
{
    public function view(User $user, File $file): bool
    {
        // Admins and Super-Admins can view any file
        if ($user->isAdmin()) {
            return true;
        }

        // Staff users can only view their own files
        if ($user->isStaff()) {
            return $user->id === $file->user_id;
        }

        // For regular users (non-staff, non-admin):
        // Allow viewing if user owns the file
        if ($user->id === $file->user_id) {
            return true;
        }

        // Allow viewing if file is public
        if ($file->visibility === 'public') {
            return true;
        }

        // Allow viewing if user has been granted access through sharing
        $hasSharedAccess = $file->shares()
            ->where('shared_with', $user->id)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->exists();

        return $hasSharedAccess;
    }

    public function update(User $user, File $file): bool
    {
        return $user->isAdmin() || $user->id === $file->user_id;
    }

    public function delete(User $user, File $file): bool
    {
        return $user->isAdmin() || $user->id === $file->user_id;
    }

    public function restore(User $user, File $file): bool
    {
        return $user->isAdmin() || $user->id === $file->user_id;
    }

    public function download(User $user, File $file): bool
    {
        // Admins and Super-Admins can download any file
        if ($user->isAdmin()) {
            return true;
        }

        // Staff users can only download their own files
        if ($user->isStaff()) {
            return $user->id === $file->user_id;
        }

        // For regular users (non-staff, non-admin):
        // Allow download if user owns the file
        if ($user->id === $file->user_id) {
            return true;
        }

        // Allow download if file is public
        if ($file->visibility === 'public') {
            return true;
        }

        // Allow download if user has been granted download permission through sharing
        $hasDownloadAccess = $file->shares()
            ->where('shared_with', $user->id)
            ->whereIn('permission', ['download', 'edit']) // download and edit permissions allow downloading
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->exists();

        return $hasDownloadAccess;
    }
}

