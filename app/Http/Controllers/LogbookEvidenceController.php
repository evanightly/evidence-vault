<?php

namespace App\Http\Controllers;

use App\Data\LogbookEvidence\LogbookEvidenceData;
use App\Models\LogbookEvidence;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class LogbookEvidenceController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = LogbookEvidence::class;
    protected array $allowedFilters = ['created_at', 'filepath', 'logbook_id', 'search', 'updated_at'];
    protected array $allowedSorts = ['created_at', 'filepath', 'id', 'logbook_id', 'updated_at'];
    protected array $allowedIncludes = ['logbook'];
    protected array $defaultIncludes = ['logbook'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(LogbookEvidence::class, 'logbook_evidence');
    }

    protected function filters(): array
    {
        return [
            'filepath',
            'logbook_id',
            MultiColumnSearchFilter::make(['filepath']),
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

        $logbookEvidences = LogbookEvidenceData::collect($items);

        return $this->respond($request, 'logbook-evidence/index', [
            'logbookEvidences' => $logbookEvidences,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('logbook-evidence/create');
    }
    public function show(LogbookEvidence $logbookEvidence): Response
    {
        return Inertia::render('logbook-evidence/show', [
            'record' => LogbookEvidenceData::fromModel($logbookEvidence)->toArray(),
        ]);
    }
    public function edit(LogbookEvidence $logbookEvidence): Response
    {
        return Inertia::render('logbook-evidence/edit', [
            'record' => LogbookEvidenceData::fromModel($logbookEvidence)->toArray(),
        ]);
    }
    public function store(LogbookEvidenceData $logbookEvidenceData): RedirectResponse
    {
        $logbookEvidence = LogbookEvidence::create($logbookEvidenceData->toArray());
        return redirect()
            ->route('logbook-evidences.index', $logbookEvidence)
            ->with('flash.success', 'LogbookEvidence created.');
    }
    public function update(LogbookEvidenceData $logbookEvidenceData, LogbookEvidence $logbookEvidence): RedirectResponse
    {
        $logbookEvidence->update($logbookEvidenceData->toArray());
        return redirect()
            ->route('logbook-evidences.index', $logbookEvidence)
            ->with('flash.success', 'LogbookEvidence updated.');
    }
    public function destroy(LogbookEvidence $logbookEvidence): RedirectResponse
    {
        $logbookEvidence->delete();
        return redirect()
            ->route('logbook-evidences.index')
            ->with('flash.success', 'LogbookEvidence deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', LogbookEvidence::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = LogbookEvidence::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
