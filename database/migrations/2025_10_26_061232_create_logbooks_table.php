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
        Schema::create('logbooks', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->text('additional_notes')->nullable();
            $table->foreignId('technician_id')->constrained('users');
            $table->foreignId('work_location_id')->constrained('work_locations');
            $table->foreignId('shift_id')->nullable()->constrained('shifts');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logbooks');
    }
};
