<?php

namespace App\Policies;

use App\Models\File;
use App\Models\User;

class FilePolicy
{
    public function view(User $user, File $file): bool
    {
        
        if ($user->isSuperAdmin()) {
            return true;
        }

        
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

        
        if ($user->role === 'staff') {
            return $user->id === $file->user_id;
        }

        
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
            
            if ($user->id === $file->user_id) return true;
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
            
            if ($user->id === $file->user_id) return true;
            return $file->user && (method_exists($file->user, 'isStaff') ? $file->user->isStaff() : (($file->user->role ?? null) === 'staff'));
        }
        
        return $user->id === $file->user_id;
    }

    public function restore(User $user, File $file): bool
    {
        return $user->is_super_admin || $user->isAdmin() || $user->id === $file->user_id;
    }

    public function download(User $user, File $file): bool
    {
        
        if (method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : (bool) ($user->is_super_admin ?? false)) {
            return true;
        }

        
        if ($user->isStaff()) {
            return $user->id === $file->user_id;
        }

        
        
        if ($user->id === $file->user_id) {
            return true;
        }

        
        if ($file->visibility === 'public') {
            return true;
        }

        
        $hasDownloadAccess = $file->shares()
            ->where('shared_with', $user->id)
            ->whereIn('permission', ['download', 'edit']) 
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->exists();

        return $hasDownloadAccess;
    }
}

