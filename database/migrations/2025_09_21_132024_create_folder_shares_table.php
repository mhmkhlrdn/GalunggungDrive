<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('folder_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('folder_id')->constrained('folders')->cascadeOnDelete();
            $table->foreignId('shared_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('shared_with')->nullable()->constrained('users')->cascadeOnDelete();
            $table->enum('permission', ['view', 'edit']);
            $table->timestamp('expires_at')->nullable();
            $table->string('token')->nullable();
            $table->boolean('is_public_link')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('folder_shares');
    }
};
