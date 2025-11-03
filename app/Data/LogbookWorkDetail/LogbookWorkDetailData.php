<?php

namespace App\Data\LogbookWorkDetail;

use App\Data\Logbook\LogbookData;
use App\Models\LogbookWorkDetail;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class LogbookWorkDetailData extends Data
{
    public function __construct(
        public int|Optional $id,
        public ?string $description,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.Logbook.LogbookData | null')]
        public ?LogbookData $logbook,
    ) {}


    public static function fromModel(LogbookWorkDetail $model): self
    {
        return new self(
            id: $model->getKey(),
            description: $model->description,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            logbook: $model->relationLoaded('logbook') && $model->logbook
                ? LogbookData::fromModel($model->logbook)
                : null,
        );
    }
}
