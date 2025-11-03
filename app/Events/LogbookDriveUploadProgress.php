<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LogbookDriveUploadProgress implements ShouldBroadcastNow {
    use Dispatchable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $extra
     */
    public function __construct(
        public int $userId,
        public int $logbookId,
        public string $status,
        public string $message,
        public int $progress = 0,
        public array $extra = [],
    ) {}

    public function broadcastOn(): Channel {
        return new PrivateChannel('logbook.drive-progress.' . $this->userId);
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array {
        return [
            'logbook_id' => $this->logbookId,
            'status' => $this->status,
            'message' => $this->message,
            'progress' => $this->progress,
            'extra' => $this->extra,
        ];
    }
}
