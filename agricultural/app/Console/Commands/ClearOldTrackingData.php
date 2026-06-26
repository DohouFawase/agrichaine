<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use App\Models\Order;
use App\Models\OrderTracking;
use Illuminate\Support\Facades\DB;

#[Signature('app:clear-old-tracking-data')]
#[Description('Command description')]
class ClearOldTrackingData extends Command
{
    /**
     * Execute the console command.
     */

    protected $signature = 'logistics:clear-tracking';

    // Description de la commande
    protected $description = 'Archive et nettoie les points de tracking';

    public function handle()
    {
        //
        $this->info('Début du nettoyage de la table de tracking...');

        // 1. Récupérer les commandes livrées ou annulées depuis plus de 48 heures qui ont encore des données de tracking
        $orders = Order::whereIn('status', ['delivered', 'cancelled'])
            ->where('updated_at', '<', now()->subDays(2))
            ->whereHas('trackings') // Suppose que tu as défini la relation trackings() dans ton modèle Order
            ->get();

        if ($orders->isEmpty()) {
            $this->info('Aucune donnée de tracking à archiver.');
            return Command::SUCCESS;
        }

        $count = 0;

        foreach ($orders as $order) {
            DB::transaction(function () use ($order, &$count) {
                // Récupérer tous les points GPS de cette commande
                $trackings = OrderTracking::where('order_id', $order->id)->orderBy('created_at', 'asc')->get();

                // Formater ces points en un historique JSON compact
                $compactRoute = $trackings->map(function ($point) {
                    return [
                        'lat' => $point->latitude,
                        'lng' => $point->longitude,
                        'at' => $point->created_at->toDateTimeString(),
                    ];
                })->toJson();

                // Sauvegarder ce résumé JSON directement dans un champ de la table orders (à prévoir en colonne text/json si tu veux)
                // $order->update(['archived_route' => $compactRoute]);

                // Supprimer définitivement les lignes lourdes de la table de tracking
                OrderTracking::where('order_id', $order->id)->delete();
                $count++;
            });
        }

        $this->info("Nettoyage terminé. {$count} historiques de commandes ont été purgés avec succès.");
        return Command::SUCCESS;
    }
}
