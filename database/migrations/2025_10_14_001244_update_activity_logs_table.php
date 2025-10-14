<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE activity_logs MODIFY COLUMN target_type ENUM('file','folder','user','auth') NOT NULL");
        DB::statement("ALTER TABLE activity_logs MODIFY COLUMN target_id BIGINT UNSIGNED NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE activity_logs MODIFY COLUMN target_type ENUM('file','folder','user') NOT NULL");
        DB::statement("ALTER TABLE activity_logs MODIFY COLUMN target_id BIGINT UNSIGNED NOT NULL");
    }
};
