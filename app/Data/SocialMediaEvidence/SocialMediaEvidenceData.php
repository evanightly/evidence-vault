<?php

namespace App\Data\SocialMediaEvidence;

use App\Data\User\UserData;
use App\Models\SocialMediaEvidence;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class SocialMediaEvidenceData extends Data
{
    public function __construct(
        public int|Optional $id,
        public ?string $name,
        public ?string $filepath,
        public ?string $created_at,
        public ?string $updated_at,
        #[TypeScriptType('App.Data.User.UserData | null')]
        public ?UserData $user,
    ) {}


    public static function fromModel(SocialMediaEvidence $model): self
    {
        return new self(
            id: $model->getKey(),
            name: $model->name,
            filepath: $model->filepath,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            user: $model->relationLoaded('user') && $model->user
                ? UserData::fromModel($model->user)
                : null,
        );
    }
}
