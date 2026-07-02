<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Services\MtnMomoService;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');



Route::post('/test-momo', function (MtnMomoService $momo) {
    try {
        // On simule une commande de 5000 FCFA pour le numéro de test 22997000000
        $transactionId = $momo->requestToPay('5000', '22997000000', 'TEST-ONABAYA');
        
        return response()->json([
            'status' => 'Succès !',
            'message' => 'Laravel a réussi à contacter MTN MoMo',
            'id_transaction_mtn' => $transactionId
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'Erreur',
            'details' => $e->getMessage()
        ], 500);
    }
});