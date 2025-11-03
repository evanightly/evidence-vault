<?php

namespace App\Http\Controllers;

use App\Data\Shift\ShiftData;
use App\Models\Shift;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class ShiftController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = Shift::class;
    protected array $allowedFilters = ['created_at', 'end_time', 'name', 'search', 'start_time', 'updated_at'];
    protected array $allowedSorts = ['created_at', 'end_time', 'id', 'name', 'start_time', 'updated_at'];
    protected array $allowedIncludes = [];
    protected array $defaultIncludes = [];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(Shift::class, 'shift');
    }

    protected function filters(): array
    {
        return [
            'name',
            MultiColumnSearchFilter::make(['name']),
            DateRangeFilter::make('created_at'),
            DateRangeFilter::make('end_time'),
            DateRangeFilter::make('start_time'),
            DateRangeFilter::make('updated_at'),
        ];
    }
    public function index(Request $request): Response|JsonResponse
    {
        $filteredData = [];

        $query = $this->buildIndexQuery($request);

        $items = $query
            ->paginate($request->input('per_page'))
            ->appends($request->query());

        $shifts = ShiftData::collect($items);

        return $this->respond($request, 'shift/index', [
            'shifts' => $shifts,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('shift/create');
    }
    public function show(Shift $shift): Response
    {
        return Inertia::render('shift/show', [
            'record' => ShiftData::fromModel($shift)->toArray(),
        ]);
    }
    public function edit(Shift $shift): Response
    {
        return Inertia::render('shift/edit', [
            'record' => ShiftData::fromModel($shift)->toArray(),
        ]);
    }
    public function store(ShiftData $shiftData): RedirectResponse
    {
        $shift = Shift::create($shiftData->toArray());
        return redirect()
            ->route('shifts.index', $shift)
            ->with('flash.success', 'Shift created.');
    }
    public function update(ShiftData $shiftData, Shift $shift): RedirectResponse
    {
        $shift->update($shiftData->toArray());
        return redirect()
            ->route('shifts.index', $shift)
            ->with('flash.success', 'Shift updated.');
    }
    public function destroy(Shift $shift): RedirectResponse
    {
        $shift->delete();
        return redirect()
            ->route('shifts.index')
            ->with('flash.success', 'Shift deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', Shift::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = Shift::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
