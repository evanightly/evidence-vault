<?php

namespace App\Services\Evidence;

class EvidenceDriveUploadResult {
    public function __construct(
        public EvidenceType $type,
        public string $month_label,
        public string $employee_name,
        public string $folder_id,
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
            'title' => sprintf('Tautan Bukti %s %s', $this->employee_name, $this->month_label),
            'subtitle' => $this->type->titleForMonth($this->month_label),
            'type_label' => $this->type->displayLabel(),
            'employee_name' => $this->employee_name,
            'month_label' => $this->month_label,
            'folder_id' => $this->folder_id,
            'folder_url' => $this->folder_url,
            'file_url' => $this->file_url,
            'file_name' => $this->file_name,
        ];
    }
}
