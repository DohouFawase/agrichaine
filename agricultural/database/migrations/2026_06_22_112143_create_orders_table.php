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
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('buyer_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('product_id')->constrained('products')->onDelete('cascade');
            $table->foreignUuid('transporter_id')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('quantity_ordered', 10, 2);
            $table->integer('total_price');
            $table->integer('delivery_fees');
            $table->enum('status', [
                'pending_payment',
                'paid_searching_driver',
                'assigned_to_driver',
                'collected',
                'delivered',
                'disputed'
            ])->default('pending_payment');

            // 1. Gestion du Vocal
            $table->string('audio_instruction_path')->nullable();

            // 2. Sécurité physique par double QR Code
            $table->string('verification_code_collection')->unique()->nullable();
            $table->string('verification_code_delivery')->unique()->nullable();

            // 3. Internationalisation & Devises
            $table->string('origin_country_code', 2)->default('BJ');
            $table->string('destination_country_code', 2)->default('BJ');
            $table->string('currency', 3)->default('XOF');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};