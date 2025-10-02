<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('storage_locations', function (Blueprint $table) {
            if (Schema::hasColumn('storage_locations', 'key')) {
                $table->dropColumn('key');
            }
            if (Schema::hasColumn('storage_locations', 'driver')) {
                $table->dropColumn('driver');
            }
            if (Schema::hasColumn('storage_locations', 'url')) {
                $table->dropColumn('url');
            }
            if (Schema::hasColumn('storage_locations', 'serve')) {
                $table->dropColumn('serve');
            }
        });
    }

    public function down(): void
    {
        Schema::table('storage_locations', function (Blueprint $table) {
            $table->string('key')->unique()->nullable();
            $table->string('driver')->default('local');
            $table->string('url')->nullable();
            $table->boolean('serve')->default(true);
        });
    }
};



