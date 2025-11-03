<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class CountByLabelData extends Data {
    public function __construct(
        public string $label,
        public int $count,
    ) {}
}
