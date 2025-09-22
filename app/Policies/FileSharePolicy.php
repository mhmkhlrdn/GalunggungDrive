<?php

namespace App\Policies;

use App\Models\FileShare;
use App\Models\User;

class FileSharePolicy
{
    public function view(User $user, FileShare $fileShare): bool
    {
        return $user->id === $fileShare->shared_by || 
               $user->id === $fileShare->shared_with;
    }

    public function update(User $user, FileShare $fileShare): bool
    {
        return $user->id === $fileShare->shared_by;
    }

    public function delete(User $user, FileShare $fileShare): bool
    {
        return $user->id === $fileShare->shared_by;
    }
}
