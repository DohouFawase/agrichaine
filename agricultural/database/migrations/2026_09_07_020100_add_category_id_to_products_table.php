<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('category')->constrained('categories')->nullOnDelete();
            $table->index(['category_id', 'status']);
        });

        DB::table('products')
            ->whereNotNull('category')
            ->select('category')
            ->distinct()
            ->pluck('category')
            ->each(function (string $name) {
                $categoryId = DB::table('categories')->where('slug', Str::slug($name))->value('id');

                if (!$categoryId) {
                    $categoryId = DB::table('categories')->insertGetId([
                        'name' => $name,
                        'slug' => Str::slug($name),
                        'is_active' => true,
                        'sort_order' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('products')->where('category', $name)->update(['category_id' => $categoryId]);
            });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropIndex(['category_id', 'status']);
            $table->dropColumn('category_id');
        });
    }
};
