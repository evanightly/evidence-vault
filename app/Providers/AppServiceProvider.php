<?php

namespace App\Providers;

use App\Models\Logbook;
use App\Models\Shift;
use App\Models\User;
use App\Models\WorkLocation;
use App\Policies\LogbookPolicy;
use App\Policies\ShiftPolicy;
use App\Policies\UserPolicy;
use App\Policies\WorkLocationPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider {
    /**
     * Register any application services.
     */
    public function register(): void {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void {
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(WorkLocation::class, WorkLocationPolicy::class);
        Gate::policy(Shift::class, ShiftPolicy::class);
        Gate::policy(Logbook::class, LogbookPolicy::class);
    }
}
