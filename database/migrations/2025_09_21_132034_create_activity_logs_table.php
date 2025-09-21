<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('action', ['upload', 'download', 'share', 'delete', 'restore', 'create_folder', 'login']);
            $table->enum('target_type', ['file', 'folder', 'user']);
            $table->unsignedBigInteger('target_id');
            $table->string('ip_address');
            $table->string('user_agent');
            $table->boolean('success');
            $table->json('details')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void {
        Schema::dropIfExists('activity_logs');
    }
};
