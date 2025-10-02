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
        'visibility',
        'is_active',
    ];

    public function diskKey(): string
    {
        return 'storage_location_' . $this->id;
    }
}


