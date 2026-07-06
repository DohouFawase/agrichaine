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
            //
            $table->timestamp('collected_at')->nullable()->after('status');
            $table->timestamp('delivered_at')->nullable()->after('collected_at');
            $table->text('dispute_reason')->nullable()->after('delivered_at');
            $table->string('buyer_dispute_reason')->nullable()->after('dispute_reason');
            $table->string('buyer_dispute_photo_path')->nullable()->after('buyer_dispute_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            //
            $table->dropColumn([
                'collected_at',
                'delivered_at',
                'dispute_reason',
                'buyer_dispute_reason',
                'buyer_dispute_photo_path',
            ]);
        });
    }
};
