<?php

use App\Models\DigitalEvidence;
use App\Models\SocialMediaEvidence;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard'));
});

test('dashboard provides evidence overview metrics', function () {
    Carbon::setTestNow(Carbon::parse('2025-12-15 08:00:00'));

    $user = User::factory()->create(['name' => 'Budi Santoso']);
    $otherUser = User::factory()->create();

    DigitalEvidence::factory()->for($user)
        ->create(['created_at' => now()->subDay(), 'updated_at' => now()->subDay()]);
    DigitalEvidence::factory()->for($user)
        ->create([
            'created_at' => now()->subMonth()->startOfMonth(),
            'updated_at' => now()->subMonth()->startOfMonth(),
        ]);
    DigitalEvidence::factory()->for($otherUser)
        ->create(['created_at' => now()->subDays(2), 'updated_at' => now()->subDays(2)]);

    SocialMediaEvidence::factory()->for($user)
        ->create(['created_at' => now()->subHours(6), 'updated_at' => now()->subHours(6)]);
    SocialMediaEvidence::factory()->for($user)
        ->create([
            'created_at' => now()->subMonths(2)->startOfMonth(),
            'updated_at' => now()->subMonths(2)->startOfMonth(),
        ]);
    SocialMediaEvidence::factory()->for($otherUser)
        ->create(['created_at' => now()->subHours(12), 'updated_at' => now()->subHours(12)]);

    config()->set('logbook.drive.enabled', true);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('overview.greeting', 'Selamat datang, Budi!')
            ->where('overview.description', 'Unggah bukti digital dan medsos langsung dari dasbor.')
            ->where('overview.current_month_label', 'Desember 2025')
            ->where('overview.drive_enabled', true)
            ->where('overview.digital.total', 3)
            ->where('overview.digital.this_month', 2)
            ->where('overview.digital.mine_total', 2)
            ->where('overview.digital.mine_this_month', 1)
            ->where('overview.social.total', 3)
            ->where('overview.social.this_month', 2)
            ->where('overview.social.mine_total', 2)
            ->where('overview.social.mine_this_month', 1)
        );

    Carbon::setTestNow();
});

test('dashboard indicates when google drive is disabled', function () {
    Carbon::setTestNow(Carbon::parse('2025-12-15 08:00:00'));

    $user = User::factory()->create(['name' => 'Siti Aminah']);

    config()->set('logbook.drive.enabled', false);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('overview.greeting', 'Selamat datang, Siti!')
            ->where('overview.drive_enabled', false)
        );

    Carbon::setTestNow();
});
