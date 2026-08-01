<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\ProcessRecurringOrders;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


Schedule::command('logistics:clear-tracking')->dailyAt('00:00');
Schedule::command(ProcessRecurringOrders::class)->hourly();
