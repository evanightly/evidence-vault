<?php

use App\Events\LogbookDriveUploadProgress;
use Illuminate\Broadcasting\PrivateChannel;

it('broadcasts logbook drive upload progress data', function () {
    $event = new LogbookDriveUploadProgress(
        userId: 7,
        logbookId: 42,
        status: 'progress',
        message: 'Mengunggah...',
        progress: 55,
        extra: ['stage' => 'uploading_evidence'],
    );

    $channel = $event->broadcastOn();

    expect($channel)
        ->toBeInstanceOf(PrivateChannel::class)
        ->and($channel->name)
        ->toBe('private-logbook.drive-progress.7');

    expect($event->broadcastAs())->toBe('LogbookDriveUploadProgress');

    expect($event->broadcastWith())->toMatchArray([
        'logbook_id' => 42,
        'status' => 'progress',
        'message' => 'Mengunggah...',
        'progress' => 55,
        'extra' => ['stage' => 'uploading_evidence'],
    ]);
});
