<?php

namespace App\Http\Controllers;

use App\Data\DigitalEvidence\DigitalEvidenceData;
use App\Models\DigitalEvidence;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class DigitalEvidenceController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = DigitalEvidence::class;
    protected array $allowedFilters = ['created_at', 'filepath', 'name', 'search', 'updated_at', 'user_id'];
    protected array $allowedSorts = ['created_at', 'filepath', 'id', 'name', 'updated_at', 'user_id'];
    protected array $allowedIncludes = ['user'];
    protected array $defaultIncludes = ['user'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(DigitalEvidence::class, 'digital_evidence');
    }

    protected function filters(): array
    {
        return [
            'filepath',
            'name',
            'user_id',
            MultiColumnSearchFilter::make(['filepath', 'name']),
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

        $digitalEvidences = DigitalEvidenceData::collect($items);

        return $this->respond($request, 'digital-evidence/index', [
            'digitalEvidences' => $digitalEvidences,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('digital-evidence/create');
    }
    public function show(DigitalEvidence $digitalEvidence): Response
    {
        return Inertia::render('digital-evidence/show', [
            'record' => DigitalEvidenceData::fromModel($digitalEvidence)->toArray(),
        ]);
    }
    public function edit(DigitalEvidence $digitalEvidence): Response
    {
        return Inertia::render('digital-evidence/edit', [
            'record' => DigitalEvidenceData::fromModel($digitalEvidence)->toArray(),
        ]);
    }
    public function store(DigitalEvidenceData $digitalEvidenceData): RedirectResponse
    {
        $digitalEvidence = DigitalEvidence::create($digitalEvidenceData->toArray());
        return redirect()
            ->route('digital-evidences.index', $digitalEvidence)
            ->with('flash.success', 'DigitalEvidence created.');
    }
    public function update(DigitalEvidenceData $digitalEvidenceData, DigitalEvidence $digitalEvidence): RedirectResponse
    {
        $digitalEvidence->update($digitalEvidenceData->toArray());
        return redirect()
            ->route('digital-evidences.index', $digitalEvidence)
            ->with('flash.success', 'DigitalEvidence updated.');
    }
    public function destroy(DigitalEvidence $digitalEvidence): RedirectResponse
    {
        $digitalEvidence->delete();
        return redirect()
            ->route('digital-evidences.index')
            ->with('flash.success', 'DigitalEvidence deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', DigitalEvidence::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = DigitalEvidence::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
