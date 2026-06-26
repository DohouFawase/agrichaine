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
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('delivery_latitude', 10, 8)->nullable()->after('status');
            $table->decimal('delivery_longitude', 11, 8)->nullable()->after('delivery_latitude');
            $table->string('delivery_address_name')->nullable()->after('delivery_longitude'); // ex: "Cotonou, Stade de l'Amitié"
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            //
        });
    }
};
