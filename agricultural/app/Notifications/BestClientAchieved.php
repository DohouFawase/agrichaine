<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\CustomerLoyaltyStatus;
use Illuminate\Notifications\Messages\BroadcastMessage;
 

class BestClientAchieved extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
   
    public function __construct(protected CustomerLoyaltyStatus $loyaltyStatus)
    {
    }


    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    // public function toMail(object $notifiable): MailMessage
    // {
    //     return (new MailMessage)
    //         ->line('The introduction to the notification.')
    //         ->action('Notification Action', url('/'))
    //         ->line('Thank you for using our application!');
    // }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $producer = $this->loyaltyStatus->producer;

        return [
            'type' => 'best_client_achieved',
            'title' => 'Vous êtes Meilleur Client !',
            'body' => "Félicitations, vous faites partie des meilleurs clients de {$producer->name}. Découvrez vos avantages exclusifs.",
            'producer_id' => $producer->id,
            'producer_name' => $producer->name,
            // 🎯 Consommé par le frontend : au tap sur la notif, il appelle
            // POST /loyalty/recurring-purchases/enable avec ce producer_id
            'action' => 'enable_recurring_purchases',
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
