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
        Schema::create('customer_loyalty_statuses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('buyer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('producer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('current_tier_id')->nullable()->constrained('loyalty_tiers')->nullOnDelete();

            // Stats recalculées sur la fenêtre glissante à chaque réévaluation
            $table->unsignedBigInteger('rolling_volume')->default(0);
            $table->unsignedInteger('rolling_orders_count')->default(0);
            $table->timestamp('period_start')->nullable();
            $table->timestamp('last_evaluated_at')->nullable();

            // Évite de renotifier plusieurs fois pour le même palier atteint
            $table->timestamp('best_client_notified_at')->nullable();

            // Activé au clic sur la notification "Meilleur Client"
            $table->boolean('recurring_purchases_enabled')->default(false);

            $table->timestamps();

            $table->unique(['buyer_id', 'producer_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_loyalty_statuses');
    }
};
