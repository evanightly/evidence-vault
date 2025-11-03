<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class DashboardTotalsData extends Data {
    public function __construct(
        public int $total_logs,
        public ?int $active_employees,
        public ?int $total_employees,
    ) {}
}
