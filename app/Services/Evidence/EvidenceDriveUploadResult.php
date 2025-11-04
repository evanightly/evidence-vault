<?php

namespace App\Services\Evidence;

class EvidenceDriveUploadResult {
    public function __construct(
        public EvidenceType $type,
        public string $month_label,
        public string $folder_url,
        public string $file_url,
        public string $file_name,
    ) {}

    /**
     * @return array<string, string>
     */
    public function toFlashPayload(): array {
        return [
            'type' => $this->type->value,
            'title' => $this->type->titleForMonth($this->month_label),
            'folder_url' => $this->folder_url,
            'file_url' => $this->file_url,
            'file_name' => $this->file_name,
        ];
    }
}
