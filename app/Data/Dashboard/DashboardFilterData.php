<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class DashboardFilterData extends Data {
    public function __construct(
        public ?string $date_from,
        public ?string $date_to,
    ) {}
}
