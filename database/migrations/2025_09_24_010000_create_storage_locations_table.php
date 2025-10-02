<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('storage_locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Deprecated: key, driver removed
            $table->string('root')->nullable(); // for local
            // Deprecated: public URL removed
            $table->string('visibility')->default('private'); // private/public
            // Deprecated: serve flag removed
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('storage_locations');
    }
};


