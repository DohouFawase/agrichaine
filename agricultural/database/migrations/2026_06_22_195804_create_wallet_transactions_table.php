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
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('wallet_id')->constrained()->onDelete('cascade');
            
            $table->decimal('amount', 12, 2);
            
         
            $table->enum('type', ['deposit', 'withdraw', 'escrow_lock', 'escrow_unlock', 'escrow_refund']);
            
            $table->string('reference')->unique();
            
            $table->string('description')->nullable();
            
            $table->timestamps();

            $table->index(['wallet_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
