<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'target_type',
        'target_id',
        'ip_address',
        'user_agent',
        'success',
        'details',
    ];

    protected $casts = [
        'details' => 'array',
        'success' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getTargetAttribute()
    {
        if ($this->target_type === 'file') {
            return File::find($this->target_id);
        } elseif ($this->target_type === 'folder') {
            return Folder::find($this->target_id);
        } elseif ($this->target_type === 'user') {
            return User::find($this->target_id);
        }
        
        return null;
    }

    public function getActionIconAttribute(): string
    {
        return match ($this->action) {
            'upload' => 'upload',
            'download' => 'download',
            'share' => 'share-2',
            'delete' => 'trash-2',
            'restore' => 'rotate-ccw',
            'create_folder' => 'folder-plus',
            'login' => 'log-in',
            default => 'activity',
        };
    }

    public function getActionColorAttribute(): string
    {
        return match ($this->action) {
            'upload' => 'text-green-600',
            'download' => 'text-blue-600',
            'share' => 'text-purple-600',
            'delete' => 'text-red-600',
            'restore' => 'text-yellow-600',
            'create_folder' => 'text-indigo-600',
            'login' => 'text-gray-600',
            default => 'text-gray-500',
        };
    }
}


