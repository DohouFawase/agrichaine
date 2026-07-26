<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration
{
   public function up(): void
    {
        DB::statement("ALTER TABLE momo_transactions MODIFY COLUMN type ENUM('topup', 'order_payment', 'withdrawal') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE momo_transactions MODIFY COLUMN type ENUM('topup', 'order_payment') NOT NULL");
    }
};
