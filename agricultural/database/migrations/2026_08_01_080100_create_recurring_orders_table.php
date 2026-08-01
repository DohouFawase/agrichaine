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
        Schema::create('recurring_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();

            $table->decimal('quantity', 10, 2);
            $table->enum('frequency', ['weekly', 'biweekly', 'monthly']);
            $table->timestamp('next_run_at');
            $table->enum('status', ['active', 'paused', 'cancelled'])->default('active');

            // Coordonnées de livraison réutilisées à chaque exécution automatique
            $table->decimal('delivery_latitude', 10, 7);
            $table->decimal('delivery_longitude', 10, 7);
            $table->string('delivery_address_name')->nullable();

            $table->timestamp('last_executed_at')->nullable();
            $table->foreignUuid('last_order_id')->nullable()->constrained('orders')->nullOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recurring_orders');
    }
};
