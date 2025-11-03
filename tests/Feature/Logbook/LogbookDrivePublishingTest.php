<?php

use App\Jobs\PublishLogbookToDrive;
use App\Models\Shift;
use App\Models\User;
use App\Models\WorkLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

function makeShiftForLocation(WorkLocation $workLocation): Shift {
    return Shift::factory()->create([
        'work_location_id' => $workLocation->getKey(),
        'name' => 'Pagi',
        'start_time' => '07:00:00',
        'end_time' => '15:00:00',
    ]);
}

it('dispatches the drive publishing job after creating a logbook when enabled', function (): void {
    Queue::fake();

    config()->set('logbook.drive.enabled', true);

    $user = User::factory()->create();
    $workLocation = WorkLocation::factory()->create(['name' => 'Studio']);
    $shift = makeShiftForLocation($workLocation);

    $response = $this
        ->actingAs($user)
        ->post(route('logbooks.store'), [
            'date' => now()->format('Y-m-d'),
            'work_location_id' => $workLocation->getKey(),
            'shift_id' => $shift->getKey(),
            'additional_notes' => 'Catatan',
            'work_details' => ['Melakukan pengecekan peralatan.'],
        ]);

    $response->assertRedirect();

    Queue::assertPushed(PublishLogbookToDrive::class);
});

it('does not dispatch the drive publishing job when disabled', function (): void {
    Queue::fake();

    config()->set('logbook.drive.enabled', false);

    $user = User::factory()->create();
    $workLocation = WorkLocation::factory()->create();
    $shift = makeShiftForLocation($workLocation);

    $response = $this
        ->actingAs($user)
        ->post(route('logbooks.store'), [
            'date' => now()->format('Y-m-d'),
            'work_location_id' => $workLocation->getKey(),
            'shift_id' => $shift->getKey(),
            'additional_notes' => 'Catatan',
            'work_details' => ['Melakukan pengecekan peralatan.'],
        ]);

    $response->assertRedirect();

    Queue::assertNotPushed(PublishLogbookToDrive::class);
});
