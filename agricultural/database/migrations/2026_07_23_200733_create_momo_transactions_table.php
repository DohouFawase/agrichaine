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
        Schema::create('momo_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->nullOnDelete();

            $table->enum('type', ['topup', 'order_payment']);
            $table->uuid('external_reference')->unique(); // X-Reference-Id envoyé à MoMo
            $table->string('phone');
            $table->unsignedBigInteger('amount');
            $table->string('currency')->default('XOF');

            // Statut interne, distinct du statut brut renvoyé par MoMo
            $table->enum('status', ['pending', 'successful', 'failed'])->default('pending');
            $table->string('momo_status')->nullable(); // PENDING / SUCCESSFUL / FAILED (valeur brute MoMo)

            // Empêche tout double crédit/déblocage même en cas d'appels concurrents
            $table->timestamp('processed_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('momo_transactions');
    }
};
