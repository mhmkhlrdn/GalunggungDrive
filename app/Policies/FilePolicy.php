<?php

namespace App\Policies;

use App\Models\File;
use App\Models\User;

class FilePolicy
{
    public function view(User $user, File $file): bool
    {
        // Super-Admins can view any file
        if ($user->is_super_admin) {
            return true;
        }

        // Staff users can only view their own files
        if ($user->isStaff()) {
            return $user->id === $file->user_id;
        }

        // Admins and regular users (non-staff):
        // Allow viewing if user owns the file, or file is public, or has been shared
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
        if ($user->is_super_admin) return true;
        if ($user->isAdmin()) {
            // Admins can edit files owned by staff users
            return $file->user && $file->user->isStaff();
        }
        return $user->id === $file->user_id;
    }

    public function delete(User $user, File $file): bool
    {
        if ($user->is_super_admin) return true;
        if ($user->isAdmin()) {
            return $file->user && $file->user->isStaff();
        }
        return $user->id === $file->user_id;
    }

    public function restore(User $user, File $file): bool
    {
        return $user->is_super_admin || $user->isAdmin() || $user->id === $file->user_id;
    }

    public function download(User $user, File $file): bool
    {
        // Super-Admins can download any file
        if ($user->is_super_admin) {
            return true;
        }

        // Staff users can only download their own files
        if ($user->isStaff()) {
            return $user->id === $file->user_id;
        }

        // Admins and regular users (non-staff):
        // Allow download if user owns the file or file is public or shared with download/edit
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

