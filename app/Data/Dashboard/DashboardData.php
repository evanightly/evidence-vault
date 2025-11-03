<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class DashboardData extends Data {
    public function __construct(
        public DashboardFilterData $filters,
        public DashboardTotalsData $totals,
        #[TypeScriptType('App.Data.Dashboard.CountByLabelData[]')]
        public array $logs_per_work_location,
        #[TypeScriptType('App.Data.Dashboard.CountByLabelData[]')]
        public array $logs_per_employee,
        #[TypeScriptType('App.Data.Dashboard.CountByLabelData[]')]
        public array $employees_per_role,
        public string $active_role,
    ) {}
}
