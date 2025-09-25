<?php

namespace App\Providers;

use App\Models\File;
use App\Models\Folder;
use App\Models\FileShare;
use App\Models\FolderShare;
use App\Policies\FileSharePolicy;
use App\Policies\FolderSharePolicy;
use App\Policies\FolderPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        File::class => \App\Policies\FilePolicy::class,
        Folder::class => FolderPolicy::class,
        FileShare::class => FileSharePolicy::class,
        FolderShare::class => FolderSharePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}

