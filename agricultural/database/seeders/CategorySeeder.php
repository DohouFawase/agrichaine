<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Céréales', 'slug' => 'cereales', 'description' => 'Riz, maïs, mil et autres céréales.', 'sort_order' => 1],
            ['name' => 'Légumineuses', 'slug' => 'legumineuses', 'description' => 'Haricots, soja, arachides et autres légumineuses.', 'sort_order' => 2],
            ['name' => 'Légumes', 'slug' => 'legumes', 'description' => 'Légumes frais et produits maraîchers.', 'sort_order' => 3],
            ['name' => 'Fruits', 'slug' => 'fruits', 'description' => 'Fruits frais de saison.', 'sort_order' => 4],
            ['name' => 'Tubercules', 'slug' => 'tubercules', 'description' => 'Manioc, igname, patate douce et tubercules.', 'sort_order' => 5],
            ['name' => 'Élevage', 'slug' => 'elevage', 'description' => 'Produits issus de l’élevage.', 'sort_order' => 6],
        ];

        foreach ($categories as $category) {
            Category::updateOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
