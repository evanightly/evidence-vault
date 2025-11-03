<?php

namespace App\Http\Controllers;

use App\Data\LogbookWorkDetail\LogbookWorkDetailData;
use App\Models\LogbookWorkDetail;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class LogbookWorkDetailController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = LogbookWorkDetail::class;
    protected array $allowedFilters = ['created_at', 'description', 'logbook_id', 'search', 'updated_at'];
    protected array $allowedSorts = ['created_at', 'description', 'id', 'logbook_id', 'updated_at'];
    protected array $allowedIncludes = ['logbook'];
    protected array $defaultIncludes = ['logbook'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(LogbookWorkDetail::class, 'logbook_work_detail');
    }

    protected function filters(): array
    {
        return [
            'description',
            'logbook_id',
            MultiColumnSearchFilter::make(['description']),
            DateRangeFilter::make('created_at'),
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

        $logbookWorkDetails = LogbookWorkDetailData::collect($items);

        return $this->respond($request, 'logbook-work-detail/index', [
            'logbookWorkDetails' => $logbookWorkDetails,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('logbook-work-detail/create');
    }
    public function show(LogbookWorkDetail $logbookWorkDetail): Response
    {
        return Inertia::render('logbook-work-detail/show', [
            'record' => LogbookWorkDetailData::fromModel($logbookWorkDetail)->toArray(),
        ]);
    }
    public function edit(LogbookWorkDetail $logbookWorkDetail): Response
    {
        return Inertia::render('logbook-work-detail/edit', [
            'record' => LogbookWorkDetailData::fromModel($logbookWorkDetail)->toArray(),
        ]);
    }
    public function store(LogbookWorkDetailData $logbookWorkDetailData): RedirectResponse
    {
        $logbookWorkDetail = LogbookWorkDetail::create($logbookWorkDetailData->toArray());
        return redirect()
            ->route('logbook-work-details.index', $logbookWorkDetail)
            ->with('flash.success', 'LogbookWorkDetail created.');
    }
    public function update(LogbookWorkDetailData $logbookWorkDetailData, LogbookWorkDetail $logbookWorkDetail): RedirectResponse
    {
        $logbookWorkDetail->update($logbookWorkDetailData->toArray());
        return redirect()
            ->route('logbook-work-details.index', $logbookWorkDetail)
            ->with('flash.success', 'LogbookWorkDetail updated.');
    }
    public function destroy(LogbookWorkDetail $logbookWorkDetail): RedirectResponse
    {
        $logbookWorkDetail->delete();
        return redirect()
            ->route('logbook-work-details.index')
            ->with('flash.success', 'LogbookWorkDetail deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', LogbookWorkDetail::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = LogbookWorkDetail::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
