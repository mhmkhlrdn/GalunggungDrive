<?php

namespace App\Policies;

use App\Models\File;
use App\Models\User;

class FilePolicy
{
    public function view(User $user, File $file): bool
    {
        // Allow viewing if user owns the file or if file is public
        return $user->id === $file->user_id || $file->visibility === 'public';
    }

    public function update(User $user, File $file): bool
    {
        return $user->id === $file->user_id;
    }

    public function delete(User $user, File $file): bool
    {
        return $user->id === $file->user_id;
    }

    public function restore(User $user, File $file): bool
    {
        return $user->id === $file->user_id;
    }
}

