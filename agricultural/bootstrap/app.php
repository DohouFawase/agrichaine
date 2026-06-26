<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',

        using: function () {
            Route::middleware('api')
                ->prefix('api/v1')
                 ->group(base_path('routes/api.php'))
                ->group(base_path('routes/v1/auth.php'))
                ->group(base_path('routes/v1/trip.php'))
                ->group(base_path('routes/v1/orders.php'))
                ->group(base_path('routes/v1/buyer.php'))
                ->group(base_path('routes/v1/wallet.php'))
                ->group(base_path('routes/v1/product.php'));
        }
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn(Request $request) => $request->is('api/*'),
        );
    })->create();
