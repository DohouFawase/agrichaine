<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration
{
        public function up(): void
    {
        DB::statement("ALTER TABLE wallet_transactions MODIFY COLUMN type ENUM('deposit', 'withdrawal', 'escrow_lock', 'escrow_unlock') NOT NULL");
    }
 
    public function down(): void
    {
        // Pas de rollback destructif ici : on ne connaît pas l'état exact
        // d'origine. À ajuster manuellement si besoin.
    }

};
