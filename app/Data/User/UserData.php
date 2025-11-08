<?php

namespace App\Data\User;

use App\Models\User;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class UserData extends Data {
    public function __construct(
        public int|Optional $id,
        public ?string $name,
        public ?string $username,
        public ?string $email,
        public ?string $role,
        public int|Optional $digital_evidence_count,
        public int|Optional $social_media_evidence_count,
        public int|Optional $total_evidence_count,
        public ?string $created_at,
        public ?string $updated_at,
        public ?string $formatted_created_at = null,
        public ?string $formatted_updated_at = null,
    ) {}

    public static function fromModel(User $model): self {
        $digitalEvidenceCount = $model->getAttribute('digital_evidence_count');
        $socialMediaEvidenceCount = $model->getAttribute('social_media_evidence_count');

        $totalEvidenceCount = null;

        if ($digitalEvidenceCount !== null || $socialMediaEvidenceCount !== null) {
            $totalEvidenceCount = (int) ($digitalEvidenceCount ?? 0) + (int) ($socialMediaEvidenceCount ?? 0);
        }

        return new self(
            id: $model->getKey(),
            name: $model->name,
            username: $model->username,
            email: $model->email,
            role: $model->role,
            digital_evidence_count: $digitalEvidenceCount ?? Optional::create(),
            social_media_evidence_count: $socialMediaEvidenceCount ?? Optional::create(),
            total_evidence_count: $totalEvidenceCount ?? Optional::create(),
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
            formatted_created_at: $model->created_at?->format('d M Y H:i'),
            formatted_updated_at: $model->updated_at?->format('d M Y H:i')
        );
    }
}
