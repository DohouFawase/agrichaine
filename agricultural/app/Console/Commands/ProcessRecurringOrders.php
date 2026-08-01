<?php

namespace App\Console\Commands;

use App\Models\RecurringOrder;
use App\Services\BuyerOrderService;
use App\Services\LoyaltyService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Exception;

class ProcessRecurringOrders extends Command
{
    /**
     * 🔧 CORRIGÉ : les attributs #[Signature(...)] / #[Description(...)]
     * générés par le stub Laravel 11 entraient en conflit avec ces propriétés
     * et prenaient le dessus — d'où la commande introuvable sous le nom
     * "loyalty:process-recurring-orders". Retirés, on garde uniquement les
     * propriétés classiques.
     */
    protected $signature = 'loyalty:process-recurring-orders';
    protected $description = 'Exécute les commandes programmées des clients VIP arrivées à échéance';

    public function handle(BuyerOrderService $buyerOrderService, LoyaltyService $loyaltyService): int
    {
        $dueOrders = RecurringOrder::where('status', 'active')
            ->where('next_run_at', '<=', now())
            ->get();

        $this->info("{$dueOrders->count()} commande(s) programmée(s) à traiter.");

        foreach ($dueOrders as $recurringOrder) {
            try {
                $loyaltyService->processRecurringOrder($recurringOrder, $buyerOrderService);
                $this->info("✅ Commande programmée {$recurringOrder->id} exécutée.");
            } catch (Exception $e) {
                Log::error('[Loyalty] Échec exécution commande programmée', [
                    'recurring_order_id' => $recurringOrder->id,
                    'error' => $e->getMessage(),
                ]);

                $recurringOrder->next_run_at = $recurringOrder->computeNextRunAt();
                $recurringOrder->save();

                $this->error("❌ Commande programmée {$recurringOrder->id} : {$e->getMessage()}");
            }
        }

        return self::SUCCESS;
    }
}