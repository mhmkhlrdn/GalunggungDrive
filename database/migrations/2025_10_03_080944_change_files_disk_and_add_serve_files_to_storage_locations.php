<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('files', function (Blueprint $table) {
            // Drop old string column
            $table->dropColumn('disk');

            // Add new foreignId
            $table->foreignId('disk_id')
                ->after('path') // place it after path column
                ->constrained('storage_locations');
        });
        Schema::table('storage_locations', function (Blueprint $table) {
            $table->boolean('can_serve')
                ->default(false)
                ->after('visibility'); // place it logically after visibility
        });
    }

    public function down(): void {
        Schema::table('files', function (Blueprint $table) {
            // Rollback: remove disk_id foreign key + column
            $table->dropForeign(['disk_id']);
            $table->dropColumn('disk_id');

            // Restore old string column
            $table->string('disk')->after('path');
        });

     Schema::table('storage_locations', function (Blueprint $table) {
            $table->dropColumn('can_serve');
        });
    }
};
