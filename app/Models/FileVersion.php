<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FileVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_id',
        'version_number',
        'path',
        'size',
        'mime_type',
        'checksum',
        'uploaded_by',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function file(): BelongsTo
    {
        return $this->belongsTo(File::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
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
}


