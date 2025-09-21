<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('file_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('file_id')->constrained('files')->cascadeOnDelete();
            $table->foreignId('shared_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('shared_with')->nullable()->constrained('users')->cascadeOnDelete();
            $table->enum('permission', ['view', 'edit', 'download']);
            $table->timestamp('expires_at')->nullable();
            $table->string('token')->nullable();
            $table->boolean('is_public_link')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('file_shares');
    }
};
