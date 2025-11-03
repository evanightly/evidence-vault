<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::table('logbooks', function (Blueprint $table) {
            $table->string('drive_folder_id')->nullable()->index();
            $table->string('drive_folder_url')->nullable();
            $table->timestamp('drive_published_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::table('logbooks', function (Blueprint $table) {
            $table->dropColumn([
                'drive_folder_id',
                'drive_folder_url',
                'drive_published_at',
            ]);
        });
    }
};
