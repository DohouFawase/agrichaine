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
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('producer_id')->constrained('users')->onDelete('cascade'); // Clé étrangère UUID
            $table->string('name');
            $table->decimal('quantity', 10, 2);
            $table->string('unit');
            $table->integer('price_per_unit');
            $table->string('location');
            $table->enum('status', ['available', 'sold_out', 'expired'])->default('available');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
