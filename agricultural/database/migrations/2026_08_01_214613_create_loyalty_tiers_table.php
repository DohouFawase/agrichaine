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
        Schema::create('loyalty_tiers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');                         // "Client Montant", "Meilleur Client"...
            $table->string('badge_slug')->unique();          // 'top_client', 'loyal_client', ...
            $table->unsignedInteger('rank');                 // 1 = plus bas, N = plus haut (Meilleur Client)
            $table->unsignedBigInteger('min_volume');        // volume d'achat minimum sur la période (FCFA)
            $table->unsignedInteger('min_orders');           // fréquence minimum (nb commandes livrées)
            $table->unsignedInteger('period_days')->default(60); // fenêtre glissante (2 mois par défaut)
            $table->boolean('grants_recurring_purchases')->default(false); // débloque la programmation d'achats
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loyalty_tiers');
    }
};
