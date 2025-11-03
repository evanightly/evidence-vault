<?php

use App\Jobs\PublishLogbookToDrive;
use App\Models\Logbook;
use App\Models\Shift;
use App\Models\User;
use App\Models\WorkLocation;
use App\Services\Logbook\LogbookDrivePublisher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery as m;

uses(Tests\TestCase::class, RefreshDatabase::class);

afterEach(function (): void {
    m::close();
});

it('publishes the logbook when enabled', function (): void {
    $logbook = createLogbook();

    /** @var m\MockInterface&LogbookDrivePublisher $publisher */
    $publisher = m::mock(LogbookDrivePublisher::class);
    $publisher->shouldReceive('isEnabled')->once()->andReturn(true);
    $publisher->shouldReceive('publish')->once()->withArgs(function (Logbook $model) use ($logbook): bool {
        return $model->is($logbook);
    });

    (new PublishLogbookToDrive($logbook->getKey()))->handle($publisher);
});

it('skips publishing when integration is disabled', function (): void {
    $logbook = createLogbook();

    /** @var m\MockInterface&LogbookDrivePublisher $publisher */
    $publisher = m::mock(LogbookDrivePublisher::class);
    $publisher->shouldReceive('isEnabled')->once()->andReturn(false);
    $publisher->shouldReceive('publish')->never();

    (new PublishLogbookToDrive($logbook->getKey()))->handle($publisher);
});

it('silently exits when the logbook no longer exists', function (): void {
    /** @var m\MockInterface&LogbookDrivePublisher $publisher */
    $publisher = m::mock(LogbookDrivePublisher::class);
    $publisher->shouldReceive('isEnabled')->once()->andReturn(true);
    $publisher->shouldReceive('publish')->never();

    (new PublishLogbookToDrive(999))->handle($publisher);
});

function createLogbook(): Logbook {
    $technician = User::factory()->create();
    $workLocation = WorkLocation::factory()->create();
    $shift = Shift::factory()->create([
        'work_location_id' => $workLocation->getKey(),
        'name' => 'Pagi',
        'start_time' => '07:00:00',
        'end_time' => '15:00:00',
    ]);

    return Logbook::factory()->create([
        'technician_id' => $technician->getKey(),
        'work_location_id' => $workLocation->getKey(),
        'shift_id' => $shift->getKey(),
    ]);
}
