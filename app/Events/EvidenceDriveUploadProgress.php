<?php

namespace App\Events;

use App\Services\Evidence\EvidenceType;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EvidenceDriveUploadProgress implements ShouldBroadcastNow {
    use Dispatchable;
    use SerializesModels;

    /**
     * @param  array<string, mixed>  $extra
     */
    public function __construct(
        public int $userId,
        public string $uploadId,
        public EvidenceType $type,
        public string $status,
        public string $message,
        public int $progress = 0,
        public array $extra = [],
    ) {}

    public function broadcastOn(): Channel {
        return new PrivateChannel('evidence.drive-progress.' . $this->userId);
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array {
        return [
            'upload_id' => $this->uploadId,
            'type' => $this->type->value,
            'status' => $this->status,
            'message' => $this->message,
            'progress' => $this->progress,
            'extra' => $this->extra,
        ];
    }

    // public function broadcastAs(): string {
    //     return 'EvidenceDriveUploadProgress';
    // }
}
