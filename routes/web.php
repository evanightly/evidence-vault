<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LogbookController;
use App\Http\Controllers\LogbookEvidenceController;
use App\Http\Controllers\LogbookWorkDetailController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkLocationController;
use App\Http\Controllers\WorkLocationShiftController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::redirect('/', 'login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::resource('users', UserController::class);
    Route::resource('logbooks', LogbookController::class);
    Route::resource('shifts', ShiftController::class);
    Route::resource('logbook-work-details', LogbookWorkDetailController::class);
    Route::resource('logbook-evidences', LogbookEvidenceController::class);
    Route::resource('work-locations', WorkLocationController::class);
    Route::resource('work-locations.shifts', WorkLocationShiftController::class)
        ->only(['store', 'update', 'destroy'])
        ->scoped();
});

require __DIR__ . '/settings.php';
