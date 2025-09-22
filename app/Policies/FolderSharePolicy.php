<?php

namespace App\Policies;

use App\Models\FolderShare;
use App\Models\User;

class FolderSharePolicy
{
    public function view(User $user, FolderShare $folderShare): bool
    {
        return $user->id === $folderShare->shared_by || 
               $user->id === $folderShare->shared_with;
    }

    public function update(User $user, FolderShare $folderShare): bool
    {
        return $user->id === $folderShare->shared_by;
    }

    public function delete(User $user, FolderShare $folderShare): bool
    {
        return $user->id === $folderShare->shared_by;
    }
}
