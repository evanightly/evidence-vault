<?php

namespace App\Data\Dashboard;

use Spatie\LaravelData\Data;
use Spatie\TypeScriptTransformer\Attributes\TypeScript;

#[TypeScript]
class DashboardUploadStatsData extends Data {
    public function __construct(
        public int $total,
        public int $this_month,
        public int $mine_total,
        public int $mine_this_month,
    ) {}
}
