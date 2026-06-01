<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\UserController;

// Auth
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard', [SaleController::class, 'dashboard']);

    // Categories
    Route::apiResource('categories', CategoryController::class);

    // Products
    Route::get('/products/low-stock', [ProductController::class, 'lowStock']);
    Route::apiResource('products', ProductController::class);

    // Clients
    Route::get('/clients',                          [ClientController::class, 'index']);
    Route::post('/clients',                         [ClientController::class, 'store']);
    Route::get('/clients/{client}',                 [ClientController::class, 'show']);
    Route::put('/clients/{client}',                 [ClientController::class, 'update']);
    Route::delete('/clients/{client}',              [ClientController::class, 'destroy']);
    Route::post('/clients/{client}/pay-credit',     [ClientController::class, 'payCredit']);
    Route::get('/clients/{client}/credit-history',  [ClientController::class, 'creditHistory']);

    // Sales
    Route::get('/sales',           [SaleController::class, 'index']);
    Route::post('/sales',          [SaleController::class, 'store']);
    Route::get('/sales/{sale}',    [SaleController::class, 'show']);
    Route::post('/sales/{sale}/cancel', [SaleController::class, 'cancel']);

    // Users (admin only)
    Route::apiResource('users', UserController::class)->except(['show']);
});