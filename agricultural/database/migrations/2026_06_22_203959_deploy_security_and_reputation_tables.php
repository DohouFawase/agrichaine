<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'identity_document_path')) {
                $table->string('identity_document_path')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'id_verified_at')) {
                $table->timestamp('id_verified_at')->nullable()->after('identity_document_path');
            }
            if (!Schema::hasColumn('users', 'average_rating')) {
                $table->decimal('average_rating', 3, 2)->default(5.00)->after('id_verified_at');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'stock_proof_photo_path')) {
                $table->string('stock_proof_photo_path')->nullable()->after('status');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'quantity_collected')) {
                $table->integer('quantity_collected')->nullable()->after('quantity_ordered');
            }
        });

        if (!Schema::hasTable('user_ratings')) {
            Schema::create('user_ratings', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('order_id')->constrained()->onDelete('cascade');
                $table->foreignUuid('from_user_id')->constrained('users')->onDelete('cascade');
                $table->foreignUuid('to_user_id')->constrained('users')->onDelete('cascade');
                $table->tinyInteger('rating')->unsigned();
                $table->text('comment')->nullable();
                $table->timestamps();
                $table->unique(['order_id', 'from_user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_ratings');

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'quantity_collected')) {
                $table->dropColumn('quantity_collected');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'stock_proof_photo_path')) {
                $table->dropColumn('stock_proof_photo_path');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            $columns = ['identity_document_path', 'id_verified_at', 'average_rating'];
            $existing = array_filter($columns, fn($col) => Schema::hasColumn('users', $col));
            if (!empty($existing)) {
                $table->dropColumn(array_values($existing));
            }
        });
    }
};