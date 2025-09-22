<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileShare extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_id',
        'shared_by',
        'shared_with',
        'permission',
        'expires_at',
        'token',
        'is_public_link',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_public_link' => 'boolean',
    ];

    public function file(): BelongsTo
    {
        return $this->belongsTo(File::class);
    }

    public function sharedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shared_by');
    }

    public function sharedWith(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shared_with');
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getShareUrlAttribute(): string
    {
        return route('shared.file', ['token' => $this->token]);
    }
}


