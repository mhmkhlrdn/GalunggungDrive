<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
    {
        DB::statement("ALTER TABLE activity_logs MODIFY COLUMN action ENUM('upload', 'download', 'share', 'delete', 'restore', 'create_folder', 'login', 'preview', 'move', 'star', 'unstar', 'edit', 'logout', 'empty') NOT NULL");
        DB::statement("ALTER TABLE activity_logs MODIFY COLUMN target_type ENUM('file','folder','user','auth', 'trash') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE activity_logs MODIFY COLUMN action ENUM('upload', 'download', 'share', 'delete', 'restore', 'create_folder', 'login', 'preview', 'move', 'star', 'unstar', 'edit', 'logout') NOT NULL");
        DB::statement("ALTER TABLE activity_logs MODIFY COLUMN target_type ENUM('file','folder','user','auth') NOT NULL");
    }
};
