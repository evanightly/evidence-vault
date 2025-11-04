<?php

use App\Jobs\UploadEvidenceToDrive;
use App\Models\DigitalEvidence;
use App\Models\SocialMediaEvidence;
use App\Models\User;
use App\Services\Evidence\EvidenceType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\assertDatabaseMissing;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    config(['broadcasting.default' => 'log']);
});
dataset('dashboardEvidenceTypes', [
    'digital' => [
        'digital_files',
        'digital_name',
        EvidenceType::Digital,
        DigitalEvidence::class,
        'Unggahan bukti digital sedang diproses. Anda akan mendapatkan notifikasi ketika selesai.',
    ],
    'social' => [
        'social_files',
        'social_name',
        EvidenceType::Social,
        SocialMediaEvidence::class,
        'Unggahan bukti medsos sedang diproses. Anda akan mendapatkan notifikasi ketika selesai.',
    ],
]);

test('authenticated users queue evidence uploads for asynchronous processing', function (string $fileField, string $nameField, EvidenceType $enum, string $modelClass, string $infoMessage) {
    Storage::fake('local');
    Queue::fake();

    $user = User::factory()->create();

    $this->actingAs($user);

    $file = UploadedFile::fake()->image("{$enum->value}-evidence.webp", 1280, 720);

    $response = $this->post(route('dashboard.uploads.store'), [
        $nameField => 'Bukti Uji',
        $fileField => [$file],
    ]);

    $response
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('flash.info', $infoMessage);

    $capturedJob = null;

    Queue::assertPushed(UploadEvidenceToDrive::class, function (UploadEvidenceToDrive $job) use (&$capturedJob, $user, $enum) {
        if ($job->userId !== $user->getKey() || $job->type !== $enum) {
            return false;
        }

        $capturedJob = $job;

        return $job->disk === 'local'
            && $job->uploadId !== ''
            && count($job->uploads) === 1;
    });

    Queue::assertPushed(UploadEvidenceToDrive::class, 1);

    expect($capturedJob)->toBeInstanceOf(UploadEvidenceToDrive::class);

    /** @var UploadEvidenceToDrive $capturedJob */
    $storedUploads = $capturedJob->uploads;

    expect($storedUploads)->toHaveCount(1);
    expect(Storage::disk('local')->exists($storedUploads[0]['stored_path']))->toBeTrue();

    assertDatabaseMissing((new $modelClass)->getTable(), [
        'name' => 'Bukti Uji',
        'user_id' => $user->getKey(),
    ]);
})->with('dashboardEvidenceTypes');

test('validation errors prevent queuing uploads', function () {
    Queue::fake();

    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->from(route('dashboard'))
        ->post(route('dashboard.uploads.store'), [
            'digital_name' => 'Tanpa Berkas',
        ]);

    $response
        ->assertRedirect(route('dashboard'))
        ->assertSessionHasErrors(['digital_files' => 'Silakan pilih minimal satu berkas untuk diunggah.']);

    Queue::assertNothingPushed();
    expect(DigitalEvidence::query()->count())->toBe(0);
    expect(SocialMediaEvidence::query()->count())->toBe(0);
});

test('submitting digital and social evidence queues both uploads', function () {
    Storage::fake('local');
    Queue::fake();

    $user = User::factory()->create();

    $this->actingAs($user);

    $digitalFile = UploadedFile::fake()->image('digital-evidence.webp', 1024, 768);
    $socialFile = UploadedFile::fake()->image('social-evidence.webp', 1024, 768);

    $response = $this->post(route('dashboard.uploads.store'), [
        'digital_name' => 'Digital Bukti',
        'digital_files' => [$digitalFile],
        'social_name' => 'Sosial Bukti',
        'social_files' => [$socialFile],
    ]);

    $response
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('flash.info', 'Unggahan bukti digital dan bukti medsos sedang diproses. Anda akan mendapatkan notifikasi ketika selesai.');

    Queue::assertPushed(UploadEvidenceToDrive::class, 2);

    Queue::assertPushed(UploadEvidenceToDrive::class, function (UploadEvidenceToDrive $job) use ($user) {
        return $job->userId === $user->getKey()
            && $job->type === EvidenceType::Digital
            && count($job->uploads) === 1;
    });

    Queue::assertPushed(UploadEvidenceToDrive::class, function (UploadEvidenceToDrive $job) use ($user) {
        return $job->userId === $user->getKey()
            && $job->type === EvidenceType::Social
            && count($job->uploads) === 1;
    });

    $jobs = Queue::pushedJobs()[UploadEvidenceToDrive::class] ?? [];

    foreach ($jobs as $pushed) {
        /** @var UploadEvidenceToDrive $job */
        $job = $pushed['job'];

        foreach ($job->uploads as $upload) {
            expect(Storage::disk('local')->exists($upload['stored_path']))->toBeTrue();
        }
    }
});

test('multiple files per evidence type are queued independently', function () {
    Storage::fake('local');
    Queue::fake();

    $user = User::factory()->create();

    $this->actingAs($user);

    $digitalFiles = [
        UploadedFile::fake()->image('digital-one.webp', 800, 600),
        UploadedFile::fake()->image('digital-two.webp', 800, 600),
    ];

    $response = $this->post(route('dashboard.uploads.store'), [
        'digital_name' => 'Banyak Bukti Digital',
        'digital_files' => $digitalFiles,
    ]);

    $response
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('flash.info', 'Unggahan bukti digital sedang diproses. Anda akan mendapatkan notifikasi ketika selesai.');

    Queue::assertPushed(UploadEvidenceToDrive::class, 1);

    $jobs = Queue::pushedJobs()[UploadEvidenceToDrive::class] ?? [];

    expect($jobs)->toHaveCount(1);

    /** @var UploadEvidenceToDrive $queued */
    $queued = $jobs[0]['job'];

    expect($queued->userId)->toBe($user->getKey());
    expect($queued->type)->toBe(EvidenceType::Digital);
    expect($queued->uploads)->toHaveCount(2);

    foreach ($queued->uploads as $upload) {
        expect(Storage::disk('local')->exists($upload['stored_path']))->toBeTrue();
    }
});
