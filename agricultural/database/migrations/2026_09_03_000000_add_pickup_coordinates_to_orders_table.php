<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('pickup_latitude', 10, 8)->nullable()->after('delivery_address_name');
            $table->decimal('pickup_longitude', 11, 8)->nullable()->after('pickup_latitude');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['pickup_latitude', 'pickup_longitude']);
        });
    }
};