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
        public ?string $created_at,
        public ?string $updated_at,
    ) {}

    public static function fromModel(User $model): self {
        return new self(
            id: $model->getKey(),
            name: $model->name,
            username: $model->username,
            email: $model->email,
            role: $model->role,
            created_at: $model->created_at?->toIso8601String(),
            updated_at: $model->updated_at?->toIso8601String(),
        );
    }
}
