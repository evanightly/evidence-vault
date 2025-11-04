<?php

use App\Events\EvidenceDriveUploadProgress;
use App\Jobs\UploadEvidenceToDrive;
use App\Models\User;
use App\Services\Evidence\EvidenceDriveUploader;
use App\Services\Evidence\EvidenceDriveUploadResult;
use App\Services\Evidence\EvidenceType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\mock;

uses(Tests\TestCase::class);
uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('job uploads evidence, stores record, and broadcasts completion', function () {
    Storage::fake('local');
    Event::fake();

    $user = User::factory()->create();

    $file = UploadedFile::fake()->image('contoh.png', 1024, 768);
    $storedPath = $file->storeAs('pending-evidence/' . $user->getKey(), 'queued-evidence.png', 'local');

    $result = new EvidenceDriveUploadResult(
        type: EvidenceType::Digital,
        month_label: 'Desember 2025',
        folder_url: 'https://drive.test/folder',
        file_url: 'https://drive.test/file',
        file_name: 'queued-evidence-20251201080000.png',
    );

    mock(EvidenceDriveUploader::class)
        ->shouldReceive('upload')
        ->once()
        ->andReturn($result);

    $job = new UploadEvidenceToDrive(
        userId: $user->getKey(),
        type: EvidenceType::Digital,
        disk: 'local',
        uploads: [
            [
                'stored_path' => $storedPath,
                'original_name' => 'contoh.png',
            ],
        ],
        customName: 'Bukti Uji',
        uploadId: (string) str()->uuid(),
    );

    $job->handle(app(EvidenceDriveUploader::class));

    assertDatabaseHas('digital_evidences', [
        'name' => 'Bukti Uji',
        'filepath' => 'https://drive.test/file',
        'user_id' => $user->getKey(),
    ]);

    Event::assertDispatched(EvidenceDriveUploadProgress::class, function (EvidenceDriveUploadProgress $event) use ($job) {
        if ($event->status !== 'completed' || $event->uploadId !== $job->uploadId) {
            return false;
        }

        $results = $event->extra['results'] ?? [];

        return is_array($results)
            && count($results) === 1
            && ($results[0]['file_url'] ?? null) === 'https://drive.test/file';
    });

    expect(Storage::disk('local')->exists($storedPath))->toBeFalse();
});

test('job failure broadcasts error and removes temporary files', function () {
    Storage::fake('local');
    Event::fake();

    $user = User::factory()->create();

    $file = UploadedFile::fake()->image('gagal.png', 800, 800);
    $storedPath = $file->storeAs('pending-evidence/' . $user->getKey(), 'gagal.png', 'local');

    mock(EvidenceDriveUploader::class)
        ->shouldReceive('upload')
        ->once()
        ->andThrow(new RuntimeException('Upload failed.'));

    $job = new UploadEvidenceToDrive(
        userId: $user->getKey(),
        type: EvidenceType::Digital,
        disk: 'local',
        uploads: [
            [
                'stored_path' => $storedPath,
                'original_name' => 'gagal.png',
            ],
        ],
        customName: 'Bukti Gagal',
        uploadId: (string) str()->uuid(),
    );

    expect(fn () => $job->handle(app(EvidenceDriveUploader::class)))->toThrow(RuntimeException::class);

    Event::assertDispatched(EvidenceDriveUploadProgress::class, function (EvidenceDriveUploadProgress $event) use ($job) {
        return $event->status === 'failed' && $event->uploadId === $job->uploadId;
    });

    assertDatabaseMissing('digital_evidences', [
        'name' => 'Bukti Gagal',
        'user_id' => $user->getKey(),
    ]);

    expect(Storage::disk('local')->exists($storedPath))->toBeFalse();
});
