<?php

use App\Models\Logbook;
use App\Models\Shift;
use App\Models\User;
use App\Models\WorkLocation;
use App\Support\RoleEnum;
use Inertia\Testing\AssertableInertia as Assert;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('dashboard'))->assertOk();
});

test('admins see aggregated dashboard metrics', function () {
    $admin = User::factory()->admin()->create();

    $studio = WorkLocation::factory()->create(['name' => 'Studio']);
    $field = WorkLocation::factory()->create(['name' => 'Lapangan']);

    $studioShift = Shift::factory()->create([
        'work_location_id' => $studio->getKey(),
        'name' => 'Pagi',
        'start_time' => '07:00:00',
        'end_time' => '15:00:00',
    ]);

    $fieldShift = Shift::factory()->create([
        'work_location_id' => $field->getKey(),
        'name' => 'Sore',
        'start_time' => '15:00:00',
        'end_time' => '23:00:00',
    ]);

    $technicianA = User::factory()->create(['name' => 'Teknisi A']);
    $technicianB = User::factory()->create(['name' => 'Teknisi B']);

    Logbook::factory()->for($technicianA, 'technician')->create([
        'date' => '2025-01-05',
        'work_location_id' => $studio->getKey(),
        'shift_id' => $studioShift->getKey(),
    ]);

    Logbook::factory()->for($technicianA, 'technician')->create([
        'date' => '2025-01-08',
        'work_location_id' => $studio->getKey(),
        'shift_id' => $studioShift->getKey(),
    ]);

    Logbook::factory()->for($technicianB, 'technician')->create([
        'date' => '2025-01-10',
        'work_location_id' => $field->getKey(),
        'shift_id' => $fieldShift->getKey(),
    ]);

    Logbook::factory()->for($technicianB, 'technician')->create([
        'date' => '2025-02-15',
        'work_location_id' => $field->getKey(),
        'shift_id' => $fieldShift->getKey(),
    ]);

    $response = $this
        ->actingAs($admin)
        ->get(route('dashboard', [
            'date_from' => '2025-01-01',
            'date_to' => '2025-01-31',
        ]));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('metrics.active_role', RoleEnum::Admin->value)
            ->where('metrics.totals.total_logs', 3)
            ->where('metrics.totals.active_employees', 2)
            ->where('metrics.totals.total_employees', 3)
            ->where('metrics.logs_per_work_location', function ($value) use ($studio, $field): bool {
                if ($value instanceof \Illuminate\Support\Collection) {
                    $value = $value->toArray();
                }

                if (!is_array($value)) {
                    return false;
                }

                $counts = collect($value)->mapWithKeys(fn ($item) => [
                    (string) ($item['label'] ?? '') => (int) ($item['count'] ?? 0),
                ]);

                return $counts->get($studio->name) === 2 && $counts->get($field->name) === 1;
            })
            ->where('metrics.logs_per_employee', function ($value) use ($technicianA, $technicianB): bool {
                if ($value instanceof \Illuminate\Support\Collection) {
                    $value = $value->toArray();
                }

                if (!is_array($value)) {
                    return false;
                }

                $counts = collect($value)->mapWithKeys(fn ($item) => [
                    (string) ($item['label'] ?? '') => (int) ($item['count'] ?? 0),
                ]);

                return $counts->get($technicianA->name) === 2 && $counts->get($technicianB->name) === 1;
            })
            ->where('metrics.employees_per_role', function ($value): bool {
                if ($value instanceof \Illuminate\Support\Collection) {
                    $value = $value->toArray();
                }

                if (!is_array($value)) {
                    return false;
                }

                $counts = collect($value)->mapWithKeys(fn ($item) => [
                    (string) ($item['label'] ?? '') => (int) ($item['count'] ?? 0),
                ]);

                return $counts->get(RoleEnum::Admin->label()) === 1
                    && $counts->get(RoleEnum::Employee->label()) === 2;
            })
        );
});

test('employees see personal dashboard metrics', function () {
    $employee = User::factory()->create(['name' => 'Teknisi A']);
    $otherEmployee = User::factory()->create(['name' => 'Teknisi B']);

    $studio = WorkLocation::factory()->create(['name' => 'Studio']);
    $field = WorkLocation::factory()->create(['name' => 'Lapangan']);

    $studioShift = Shift::factory()->create([
        'work_location_id' => $studio->getKey(),
        'name' => 'Pagi',
        'start_time' => '07:00:00',
        'end_time' => '15:00:00',
    ]);

    $fieldShift = Shift::factory()->create([
        'work_location_id' => $field->getKey(),
        'name' => 'Sore',
        'start_time' => '15:00:00',
        'end_time' => '23:00:00',
    ]);

    Logbook::factory()->for($employee, 'technician')->create([
        'date' => '2025-03-01',
        'work_location_id' => $studio->getKey(),
        'shift_id' => $studioShift->getKey(),
    ]);

    Logbook::factory()->for($employee, 'technician')->create([
        'date' => '2025-03-02',
        'work_location_id' => $field->getKey(),
        'shift_id' => $fieldShift->getKey(),
    ]);

    Logbook::factory()->for($otherEmployee, 'technician')->create([
        'date' => '2025-03-03',
        'work_location_id' => $field->getKey(),
        'shift_id' => $fieldShift->getKey(),
    ]);

    $response = $this->actingAs($employee)->get(route('dashboard'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('metrics.active_role', RoleEnum::Employee->value)
            ->where('metrics.totals.total_logs', 2)
            ->where('metrics.totals.active_employees', null)
            ->where('metrics.totals.total_employees', null)
            ->where('metrics.logs_per_employee', function ($value): bool {
                if ($value instanceof \Illuminate\Support\Collection) {
                    $value = $value->toArray();
                }

                return is_array($value) && count($value) === 0;
            })
            ->where('metrics.employees_per_role', function ($value): bool {
                if ($value instanceof \Illuminate\Support\Collection) {
                    $value = $value->toArray();
                }

                return is_array($value) && count($value) === 0;
            })
            ->where('metrics.logs_per_work_location', function ($value) use ($studio, $field): bool {
                if ($value instanceof \Illuminate\Support\Collection) {
                    $value = $value->toArray();
                }

                if (!is_array($value)) {
                    return false;
                }

                $counts = collect($value)->mapWithKeys(fn ($item) => [
                    (string) ($item['label'] ?? '') => (int) ($item['count'] ?? 0),
                ]);

                return $counts->get($studio->name) === 1
                    && $counts->get($field->name) === 1
                    && count($value) === 2;
            })
        );
});
