<?php

namespace App\Policies;

use App\Models\Folder;
use App\Models\User;

class FolderPolicy
{
    public function view(User $user, Folder $folder): bool
    {
        
        if ($user->isSuperAdmin()) {
            return true;
        }

        
        if ($user->isAdmin()) {
            if ($user->id === $folder->user_id) return true;
            if ($folder->visibility && $folder->visibility !== 'private') return true;
            return $folder->shares()
                ->where('shared_with', $user->id)
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                })
                ->exists();
        }

        
        if ($user->role === 'staff') {
            return $user->id === $folder->user_id;
        }

        
        if ($user->id === $folder->user_id) {
            return true;
        }
        if ($folder->visibility === 'public') {
            return true;
        }

        
        return $folder->shares()
            ->where('shared_with', $user->id)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }

    public function update(User $user, Folder $folder): bool
    {
        if (method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : (bool) ($user->is_super_admin ?? false)) return true;

        if (method_exists($user, 'isAdmin') ? $user->isAdmin() : (bool) ($user->is_admin ?? false)) {
            
            if ($user->id === $folder->user_id) return true;
            return $folder->user && (method_exists($folder->user, 'isStaff') ? $folder->user->isStaff() : (($folder->user->role ?? null) === 'staff'));
        }

        return $user->id === $folder->user_id;
    }

    public function delete(User $user, Folder $folder): bool
    {
        if (method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : (bool) ($user->is_super_admin ?? false)) {
            return true;
        }

        if (method_exists($user, 'isAdmin') ? $user->isAdmin() : (bool) ($user->is_admin ?? false)) {
            
            if ($user->id === $folder->user_id) return true;
            return $folder->user && (method_exists($folder->user, 'isStaff') ? $folder->user->isStaff() : (($folder->user->role ?? null) === 'staff'));
        }

        
        return $user->id === $folder->user_id;
    }

    public function restore(User $user, Folder $folder): bool
    {
        return $user->isSuperAdmin() || $user->isAdmin() || $user->id === $folder->user_id;
    }
    
    public function download(User $user, Folder $folder): bool
    {
        
        if (method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : (bool) ($user->is_super_admin ?? false)) {
            return true;
        }

        
        if ($user->isStaff()) {
            return $user->id === $folder->user_id;
        }

        
        
        if ($user->id === $folder->user_id) {
            return true;
        }

        if ($folder->visibility === 'public') {
            return true;
        }

        
        $hasDownloadAccess = $folder->shares()
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
