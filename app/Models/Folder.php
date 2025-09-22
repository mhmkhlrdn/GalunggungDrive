<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Folder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'parent_id',
        'name',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Folder::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Folder::class, 'parent_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(File::class);
    }

    public function shares(): HasMany
    {
        return $this->hasMany(FolderShare::class);
    }

    public function getPathAttribute(): string
    {
        $path = collect([$this->name]);
        $parent = $this->parent;
        
        while ($parent) {
            $path->prepend($parent->name);
            $parent = $parent->parent;
        }
        
        return $path->implode('/');
    }

    public function getTotalFilesAttribute(): int
    {
        return $this->files()->count() + $this->children()->withCount('files')->get()->sum('files_count');
    }

    public function getTotalSizeAttribute(): int
    {
        $filesSize = $this->files()->sum('size');
        $childrenSize = $this->children()->withSum('files', 'size')->get()->sum('files_sum_size');
        
        return $filesSize + $childrenSize;
    }
}


