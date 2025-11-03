<?php

namespace App\Http\Controllers;

use App\Data\Dashboard\CountByLabelData;
use App\Data\Dashboard\DashboardData;
use App\Data\Dashboard\DashboardFilterData;
use App\Data\Dashboard\DashboardTotalsData;
use App\Models\Logbook;
use App\Models\User;
use App\Support\RoleEnum;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller {
    public function __invoke(Request $request): Response {
        $validated = $request->validate([
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $dateFrom = isset($validated['date_from'])
            ? Carbon::createFromFormat('Y-m-d', (string) $validated['date_from'])
            : null;
        $dateTo = isset($validated['date_to'])
            ? Carbon::createFromFormat('Y-m-d', (string) $validated['date_to'])
            : null;

        if ($dateFrom && $dateTo && $dateFrom->greaterThan($dateTo)) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        $user = $request->user();
        $activeRole = RoleEnum::tryFrom($user?->role ?? '') ?? RoleEnum::Employee;

        $baseQuery = Logbook::query()
            ->when($dateFrom, static fn ($query) => $query->whereDate('date', '>=', $dateFrom->toDateString()))
            ->when($dateTo, static fn ($query) => $query->whereDate('date', '<=', $dateTo->toDateString()));

        if ($activeRole === RoleEnum::Employee && $user) {
            $baseQuery->where('technician_id', $user->getKey());
        }

        $totalLogs = (clone $baseQuery)->count();

        $workLocationBreakdown = (clone $baseQuery)
            ->leftJoin('work_locations', 'work_locations.id', '=', 'logbooks.work_location_id')
            ->selectRaw("COALESCE(work_locations.name, 'Tanpa Lokasi') as label, COUNT(*) as count")
            ->groupBy('work_locations.id', 'work_locations.name')
            ->orderByDesc('count')
            ->get()
            ->map(static fn ($row) => CountByLabelData::from([
                'label' => (string) $row->label,
                'count' => (int) $row->count,
            ]))
            ->values()
            ->all();

        $employeeBreakdown = [];
        $activeEmployeesCount = null;
        $employeesPerRole = [];
        $totalEmployees = null;

        if ($activeRole !== RoleEnum::Employee) {
            $employeeBreakdown = (clone $baseQuery)
                ->join('users', 'users.id', '=', 'logbooks.technician_id')
                ->selectRaw('users.id as technician_id, users.name as label, COUNT(*) as count')
                ->groupBy('users.id', 'users.name')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->map(static fn ($row) => CountByLabelData::from([
                    'label' => (string) $row->label,
                    'count' => (int) $row->count,
                ]))
                ->values()
                ->all();

            $activeEmployeesCount = (clone $baseQuery)
                ->distinct('technician_id')
                ->count('technician_id');

            $employeesPerRole = User::query()
                ->select('role', DB::raw('COUNT(*) as count'))
                ->groupBy('role')
                ->orderBy('role')
                ->get()
                ->map(static function ($row) {
                    $roleEnum = RoleEnum::tryFrom((string) $row->role);

                    return CountByLabelData::from([
                        'label' => $roleEnum ? $roleEnum->label() : (string) $row->role,
                        'count' => (int) $row->count,
                    ]);
                })
                ->values()
                ->all();

            $totalEmployees = array_reduce(
                $employeesPerRole,
                static fn (int $carry, CountByLabelData $data) => $carry + $data->count,
                0
            );
        }

        $filters = new DashboardFilterData(
            date_from: $dateFrom?->toDateString(),
            date_to: $dateTo?->toDateString(),
        );

        $totals = new DashboardTotalsData(
            total_logs: $totalLogs,
            active_employees: $activeEmployeesCount,
            total_employees: $totalEmployees,
        );

        $metrics = new DashboardData(
            filters: $filters,
            totals: $totals,
            logs_per_work_location: $workLocationBreakdown,
            logs_per_employee: $employeeBreakdown,
            employees_per_role: $employeesPerRole,
            active_role: $activeRole->value,
        );

        return Inertia::render('dashboard', [
            'metrics' => $metrics,
        ]);
    }
}
