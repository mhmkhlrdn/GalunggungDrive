<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  public function up(): void
    {
        Schema::table('files', function (Blueprint $table) {
            // Drop the existing foreign key if it exists
            $table->dropForeign(['disk_id']);

            // Recreate it with cascade on delete
            $table->foreign('disk_id')
                ->references('id')
                ->on('storage_locations')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            // Drop the cascade version
            $table->dropForeign(['disk_id']);

            // Recreate without cascade (default restrict behavior)
            $table->foreign('disk_id')
                ->references('id')
                ->on('storage_locations');
        });
    }
};
