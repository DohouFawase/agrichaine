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
        Schema::create('loyalty_ties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('badge_slug')->unique();
            $table->unsignedInteger('rank');
            $table->unsignedBigInteger('min_volume');
            $table->unsignedInteger('min_orders');
            $table->unsignedInteger('period_days')->default(60);
            $table->boolean('grants_recurring_purchases')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_ties');
    }
};
