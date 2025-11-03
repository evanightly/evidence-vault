<?php

namespace App\Data\LogbookEvidence;

use App\Data\Logbook\LogbookData;
use App\Models\LogbookEvidence;
use Illuminate\Support\Facades\Storage;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class LogbookEvidenceData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $filepath,
        #[TypeScriptType('string | null')]
        public ?string $filename,
        #[TypeScriptType('string | null')]
        public ?string $url,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.Logbook.LogbookData | null')]
        public ?LogbookData $logbook,
    ) {}

    public static function fromModel(LogbookEvidence $model): self {
        $disk = config('logbook.attachments_disk');
        $filesystem = Storage::disk($disk);
        $url = null;

        if ($model->filepath) {
            if (method_exists($filesystem, 'url')) {
                /** @var callable(string): string $urlResolver */
                $urlResolver = [$filesystem, 'url'];
                $url = $urlResolver($model->filepath);
            } else {
                $url = Storage::url($model->filepath);
            }
        }

        $filename = $model->filepath ? basename($model->filepath) : null;

        return new self(
            id: $model->getKey(),
            filepath: $model->filepath,
            filename: $filename,
            url: $url,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            logbook: $model->relationLoaded('logbook') && $model->logbook
                ? LogbookData::fromModel($model->logbook)
                : null,
        );
    }
}
