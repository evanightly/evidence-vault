<?php

namespace App\Data\Logbook;

use App\Data\LogbookEvidence\LogbookEvidenceData;
use App\Data\LogbookWorkDetail\LogbookWorkDetailData;
use App\Data\Shift\ShiftData;
use App\Data\User\UserData;
use App\Data\WorkLocation\WorkLocationData;
use App\Models\Logbook;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class LogbookData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $date,
        public ?string $additional_notes,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.User.UserData | null')]
        public ?UserData $technician,
        #[TypeScriptType('App.Data.WorkLocation.WorkLocationData | null')]
        public ?WorkLocationData $work_location,
        #[TypeScriptType('App.Data.Shift.ShiftData | null')]
        public ?ShiftData $shift,
        #[TypeScriptType('App.Data.LogbookWorkDetail.LogbookWorkDetailData[]')]
        public array|Optional $work_details,
        #[TypeScriptType('App.Data.LogbookEvidence.LogbookEvidenceData[]')]
        public array|Optional $evidences,
        public ?string $drive_folder_id,
        public ?string $drive_folder_url,
        public ?string $drive_published_at,
    ) {}

    public static function fromModel(Logbook $model): self {
        return new self(
            id: $model->getKey(),
            date: $model->date?->toIso8601String(),
            additional_notes: $model->additional_notes,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            technician: $model->relationLoaded('technician') && $model->technician
                ? UserData::fromModel($model->technician)
                : null,
            work_location: $model->relationLoaded('work_location') && $model->work_location
                ? WorkLocationData::fromModel($model->work_location)
                : null,
            shift: $model->relationLoaded('shift') && $model->shift
                ? ShiftData::fromModel($model->shift)
                : null,
            work_details: $model->relationLoaded('work_details')
                ? $model->work_details->map(fn ($workDetail) => LogbookWorkDetailData::fromModel($workDetail))->all()
                : Optional::create(),
            evidences: $model->relationLoaded('evidences')
                ? $model->evidences->map(fn ($evidence) => LogbookEvidenceData::fromModel($evidence))->all()
                : Optional::create(),
            drive_folder_id: $model->drive_folder_id,
            drive_folder_url: $model->drive_folder_url,
            drive_published_at: $model->drive_published_at?->toIso8601String(),
        );
    }
}
