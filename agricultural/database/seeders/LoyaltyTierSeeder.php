<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\LoyaltyTier;
use Illuminate\Database\Seeder;

class LoyaltyTierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        LoyaltyTier::updateOrCreate(
            ['badge_slug' => 'montant_client'],
            [
                'name'                        => 'Client Montant',
                'rank'                        => 1,
                'min_volume'                  => 50_000,   // 50 000 FCFA cumulés sur 2 mois
                'min_orders'                  => 2,
                'period_days'                 => 60,
                'grants_recurring_purchases'  => false,
                'is_active'                   => true,
            ]
        );

        LoyaltyTier::updateOrCreate(
            ['badge_slug' => 'loyal_client'],
            [
                'name'                        => 'Client Fidèle',
                'rank'                        => 2,
                'min_volume'                  => 150_000,  // 150 000 FCFA cumulés sur 2 mois
                'min_orders'                  => 5,
                'period_days'                 => 60,
                'grants_recurring_purchases'  => false,
                'is_active'                   => true,
            ]
        );

        LoyaltyTier::updateOrCreate(
            ['badge_slug' => 'top_client'],
            [
                'name'                        => 'Meilleur Client',
                'rank'                        => 3,
                'min_volume'                  => 300_000,  // 300 000 FCFA cumulés sur 2 mois
                'min_orders'                  => 8,
                'period_days'                 => 60,
                'grants_recurring_purchases'  => true,     // 🎯 débloque la programmation d'achats
                'is_active'                   => true,
            ]
        );
    }
}
