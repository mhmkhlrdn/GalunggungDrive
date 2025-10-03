<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StorageLocation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'root',
        'is_active',
        'can_serve',
    ];

    /**
     * Scope: Only active storage locations.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: Active and allowed to serve files (can_serve = true)
     */
    public function scopeServing($query)
    {
        return $query->where('is_active', true)->where('can_serve', true);
    }

    public function diskKey(): string
    {
        return 'storage_location_' . $this->id;
    }
}


