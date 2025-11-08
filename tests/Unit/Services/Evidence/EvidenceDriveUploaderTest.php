<?php

use App\Models\User;
use App\Services\Evidence\EvidenceDriveUploader;
use App\Services\Evidence\EvidenceType;
use App\Services\GoogleDrive\DriveClient;
use Google\Service\Drive\DriveFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;

uses(Tests\TestCase::class);
uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('uploader stores evidence using quarter-based folder structure', function () {
    Carbon::setTestNow(Carbon::parse('2025-12-05 10:00:00'));

    $user = User::factory()->create(['name' => 'Eka Putri']);
    $file = UploadedFile::fake()->image('bukti.png');

    $driveClient = \Mockery::mock(DriveClient::class);

    $driveClient->shouldReceive('isEnabled')->once()->andReturnTrue();
    $driveClient->shouldReceive('sanitiseFolderSegment')->with('Eka Putri')->andReturn('Eka Putri');
    $driveClient->shouldReceive('sanitiseFolderSegment')
        ->with('Triwulan 4 - 2025 (Oktober November Desember)')
        ->andReturn('Triwulan 4 - 2025 Oktober November Desember');
    $driveClient->shouldReceive('ensureFolderPath')
        ->once()
        ->with(\Mockery::on(function (array $segments) {
            expect($segments)->toHaveCount(4);
            expect($segments[0])->toBe('Evidence');
            expect($segments[1])->toBe('Triwulan 4 - 2025 Oktober November Desember');
            expect($segments[2])->toBe('Eka Putri');
            expect($segments[3])->toBe('Digital');

            return true;
        }))
        ->andReturn(new DriveFile([
            'id' => 'folder-123',
            'webViewLink' => 'https://drive.test/folder',
        ]));
    $driveClient->shouldReceive('uploadFile')
        ->once()
        ->with('folder-123', \Mockery::type('string'), 'image/png', \Mockery::type('string'))
        ->andReturn(new DriveFile([
            'id' => 'file-789',
            'name' => 'bukti.png',
            'webViewLink' => 'https://drive.test/file',
        ]));
    $driveClient->shouldReceive('setPubliclyReadable')->once()->with('file-789');

    $uploader = new EvidenceDriveUploader($driveClient);

    $result = $uploader->upload($user, $file, EvidenceType::Digital);

    expect($result->month_label)->toBe('Desember 2025');
    expect($result->folder_url)->toBe('https://drive.test/folder');
    expect($result->file_url)->toBe('https://drive.test/file');

    Carbon::setTestNow();
});
