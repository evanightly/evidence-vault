<?php

namespace App\Data\WorkLocation;

use App\Data\Shift\ShiftData;
use App\Models\WorkLocation;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class WorkLocationData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $name,
        public int|Optional $shifts_count,
        #[TypeScriptType('App.Data.Shift.ShiftData[]')]
        public array|Optional $shifts,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(WorkLocation $model): self {
        return new self(
            id: $model->getKey(),
            name: $model->name,
            shifts_count: $model->shifts_count ?? $model->shifts()->count(),
            shifts: $model->relationLoaded('shifts')
                ? $model->shifts->map(fn ($shift) => ShiftData::fromModel($shift))->all()
                : Optional::create(),
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
