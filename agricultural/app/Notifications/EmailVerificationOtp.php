<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailVerificationOtp extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public string $code)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Code de vérification de votre compte')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Votre code de vérification est :')
            ->line('**' . $this->code . '**')
            ->line('Ce code expire dans 10 minutes et ne peut être utilisé qu’une seule fois.')
            ->line('Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.');
    }
}
