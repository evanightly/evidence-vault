<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;
use Spatie\TypeScriptTransformer\Attributes\TypeScriptType;

#[TypeScript]
class DashboardData extends Data {
    public function __construct(
        public string $greeting,
        public string $description,
        public string $current_month_label,
        #[TypeScriptType('App.Data.Dashboard.DashboardUploadStatsData')]
        public DashboardUploadStatsData $digital,
        #[TypeScriptType('App.Data.Dashboard.DashboardUploadStatsData')]
        public DashboardUploadStatsData $social,
        public bool $drive_enabled,
    ) {}
}
