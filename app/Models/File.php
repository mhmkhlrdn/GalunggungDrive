<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class File extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'folder_id',
        'name',
        'path',
        'disk',
        'size',
        'mime_type',
        'checksum',
        'description',
        'visibility',
        'tags',
    ];

    protected $casts = [
        'tags' => 'array',
        'size' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(FileVersion::class);
    }

    public function shares(): HasMany
    {
        return $this->hasMany(FileShare::class);
    }

    public function starredBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_starred', 'file_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Check if this file is starred by a specific user
     */
    public function isStarredBy(User $user): bool
    {
        return $this->starredBy()->where('user_id', $user->id)->exists();
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    public function getIconAttribute(): string
    {
        $mimeType = $this->mime_type;
        
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'music';
        } elseif (in_array($mimeType, ['application/pdf'])) {
            return 'file-text';
        } elseif (in_array($mimeType, [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ])) {
            return 'file-text';
        } elseif (in_array($mimeType, [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ])) {
            return 'table';
        } elseif (in_array($mimeType, [
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ])) {
            return 'presentation';
        } elseif (in_array($mimeType, [
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed'
        ])) {
            return 'archive';
        } else {
            return 'file';
        }
    }
}


