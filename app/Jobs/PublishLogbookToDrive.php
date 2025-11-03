<?php

namespace App\Jobs;

use App\Events\LogbookDriveUploadProgress;
use App\Models\Logbook;
use App\Services\Logbook\LogbookDrivePublisher;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class PublishLogbookToDrive implements ShouldQueue {
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $logbookId) {}

    public function handle(LogbookDrivePublisher $publisher): void {
        if (!$publisher->isEnabled()) {
            return;
        }

        $logbook = Logbook::query()
            ->with([
                'technician',
                'work_location',
                'shift',
                'work_details',
                'evidences',
            ])
            ->find($this->logbookId);

        if (!$logbook) {
            return;
        }

        $userId = $logbook->technician_id ?? $logbook->technician?->getKey();

        if ($userId) {
            $this->broadcastProgress($userId, $logbook->getKey(), 'started', 'Proses unggah bukti logbook dimulai...', 5);
        }

        try {
            $publisher->publish($logbook, function (string $stage, string $message, int $progress, array $context = []) use ($userId, $logbook) {
                if (!$userId) {
                    return;
                }

                $this->broadcastProgress($userId, $logbook->getKey(), 'progress', $message, $progress, array_merge($context, [
                    'stage' => $stage,
                ]));
            });

            if ($userId) {
                $this->broadcastProgress($userId, $logbook->getKey(), 'completed', 'Bukti logbook berhasil dipublikasikan.', 100);
            }
        } catch (Throwable $exception) {
            if ($userId) {
                $this->broadcastProgress($userId, $logbook->getKey(), 'failed', 'Gagal memublikasikan bukti logbook.', 100, [
                    'error' => $exception->getMessage(),
                ]);
            }

            Log::error('Failed to publish logbook to Google Drive.', [
                'logbook_id' => $this->logbookId,
                'message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    private function broadcastProgress(int $userId, int $logbookId, string $status, string $message, int $progress = 0, array $extra = []): void {
        event(new LogbookDriveUploadProgress(
            userId: $userId,
            logbookId: $logbookId,
            status: $status,
            message: $message,
            progress: $progress,
            extra: $extra,
        ));
    }
}
