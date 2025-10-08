<?php

namespace App\Policies;

use App\Models\File;
use App\Models\User;

class FilePolicy
{
    public function view(User $user, File $file): bool
    {
        // Super-Admins can view any file
        if ($user->isSuperAdmin()) {
            return true;
        }

        // Admins can view any non-private file or any file they own or that's shared to them
        if ($user->isAdmin()) {
            if ($user->id === $file->user_id) return true;
            if ($file->visibility && $file->visibility !== 'private') return true;
            return $file->shares()
                ->where('shared_with', $user->id)
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                })
                ->exists();
        }

        // Staff users can only view their own files
        if ($user->role === 'staff') {
            return $user->id === $file->user_id;
        }

        // Regular users: own, public, or shared
        if ($user->id === $file->user_id) {
            return true;
        }
        if ($file->visibility === 'public') {
            return true;
        }
        return $file->shares()
            ->where('shared_with', $user->id)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }

    public function update(User $user, File $file): bool
    {
        if (method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : (bool) ($user->is_super_admin ?? false)) return true;
        if (method_exists($user, 'isAdmin') ? $user->isAdmin() : (bool) ($user->is_admin ?? false)) {
            // Admins can edit files owned by staff users
            return $file->user && (method_exists($file->user, 'isStaff') ? $file->user->isStaff() : (($file->user->role ?? null) === 'staff'));
        }
        return $user->id === $file->user_id;
    }

    public function delete(User $user, File $file): bool
    {
        if (method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : (bool) ($user->is_super_admin ?? false)) {
            return true;
        }
        if (method_exists($user, 'isAdmin') ? $user->isAdmin() : (bool) ($user->is_admin ?? false)) {
            // Admins can delete their own files or files owned by staff
            if ($user->id === $file->user_id) return true;
            return $file->user && (method_exists($file->user, 'isStaff') ? $file->user->isStaff() : (($file->user->role ?? null) === 'staff'));
        }
        // Staff and regular users can only delete their own files
        return $user->id === $file->user_id;
    }

    public function restore(User $user, File $file): bool
    {
        return $user->is_super_admin || $user->isAdmin() || $user->id === $file->user_id;
    }

    public function download(User $user, File $file): bool
    {
        // Super-Admins can download any file
        if (method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : (bool) ($user->is_super_admin ?? false)) {
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

