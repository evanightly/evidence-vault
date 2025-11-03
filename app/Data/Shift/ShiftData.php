<?php

namespace App\Data\Shift;

use App\Models\Shift;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class ShiftData extends Data {
    public function __construct(
        public int|Optional $id,
        public int $work_location_id,
        public ?string $name,
        public ?string $start_time,
        public ?string $end_time,
        public ?string $start_time_label,
        public ?string $end_time_label,
        public ?string $time_range_label,
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(Shift $model): self {
        $startForInput = $model->start_time?->format('H:i');
        $endForInput = $model->end_time?->format('H:i');
        $startLabel = $model->start_time?->format('H.i');
        $endLabel = $model->end_time?->format('H.i');

        return new self(
            id: $model->getKey(),
            work_location_id: $model->work_location_id,
            name: $model->name,
            start_time: $startForInput,
            end_time: $endForInput,
            start_time_label: $startLabel,
            end_time_label: $endLabel,
            time_range_label: ($startLabel && $endLabel) ? sprintf('%s - %s', $startLabel, $endLabel) : null,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
