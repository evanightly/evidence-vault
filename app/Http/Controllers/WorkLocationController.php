<?php

namespace App\Http\Controllers;

use App\Data\Shift\ShiftData;
use App\Data\WorkLocation\WorkLocationData;
use App\Http\Requests\WorkLocation\StoreWorkLocationRequest;
use App\Http\Requests\WorkLocation\UpdateWorkLocationRequest;
use App\Models\WorkLocation;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkLocationController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = WorkLocation::class;
    protected array $allowedFilters = ['created_at', 'name', 'search', 'updated_at'];
    protected array $allowedSorts = ['created_at', 'id', 'name', 'updated_at'];
    protected array $allowedIncludes = [];
    protected array $defaultIncludes = [];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(WorkLocation::class, 'work_location');
    }

    protected function filters(): array {
        return [
            'name',
            MultiColumnSearchFilter::make(['name']),
            DateRangeFilter::make('created_at'),
            DateRangeFilter::make('updated_at'),
        ];
    }

    public function index(Request $request): Response|JsonResponse {
        $query = $this->buildIndexQuery($request)
            ->withCount('shifts');

        $items = $query
            ->paginate($request->input('per_page'))
            ->appends($request->query());

        $workLocations = WorkLocationData::collect($items);

        return $this->respond($request, 'work-location/index', [
            'workLocations' => $workLocations,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => [],
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
            'can' => [
                'create' => $request->user()?->can('create', WorkLocation::class) ?? false,
            ],
        ]);
    }

    public function create(): Response {
        return Inertia::render('work-location/create');
    }

    public function show(Request $request, WorkLocation $workLocation): Response {
        $workLocation->loadCount('shifts');

        $shifts = ShiftData::collect(
            $workLocation
                ->shifts()
                ->orderBy('start_time')
                ->get()
        );

        return Inertia::render('work-location/show', [
            'record' => WorkLocationData::fromModel($workLocation)->toArray(),
            'shifts' => $shifts,
            'can' => [
                'update' => $request->user()?->can('update', $workLocation) ?? false,
                'delete' => $request->user()?->can('delete', $workLocation) ?? false,
            ],
        ]);
    }

    public function edit(WorkLocation $workLocation): Response {
        return Inertia::render('work-location/edit', [
            'record' => WorkLocationData::fromModel($workLocation->loadCount('shifts'))->toArray(),
        ]);
    }

    public function store(StoreWorkLocationRequest $request): RedirectResponse {
        $workLocation = WorkLocation::create($request->validated());

        return redirect()
            ->route('work-locations.show', $workLocation)
            ->with('flash.success', 'Lokasi kerja berhasil dibuat.');
    }

    public function update(UpdateWorkLocationRequest $request, WorkLocation $workLocation): RedirectResponse {
        $workLocation->update($request->validated());

        return redirect()
            ->route('work-locations.show', $workLocation)
            ->with('flash.success', 'Lokasi kerja berhasil diperbarui.');
    }

    public function destroy(Request $request, WorkLocation $workLocation): RedirectResponse {
        $this->authorize('delete', $workLocation);

        $workLocation->delete();

        return redirect()
            ->route('work-locations.index')
            ->with('flash.success', 'Lokasi kerja berhasil dihapus.');
    }

    public function bulkDelete(Request $request): JsonResponse {
        $this->authorize('deleteAny', WorkLocation::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = WorkLocation::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Berhasil menghapus %d data terpilih.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }
}
