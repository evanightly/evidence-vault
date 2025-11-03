<?php

namespace App\Http\Controllers;

use App\Data\SocialMediaEvidence\SocialMediaEvidenceData;
use App\Models\SocialMediaEvidence;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class SocialMediaEvidenceController extends BaseResourceController
{
    use AuthorizesRequests;

    protected string $modelClass = SocialMediaEvidence::class;
    protected array $allowedFilters = ['created_at', 'filepath', 'name', 'search', 'updated_at', 'user_id'];
    protected array $allowedSorts = ['created_at', 'filepath', 'id', 'name', 'updated_at', 'user_id'];
    protected array $allowedIncludes = ['user'];
    protected array $defaultIncludes = ['user'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct()
    {
        $this->authorizeResource(SocialMediaEvidence::class, 'social_media_evidence');
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

        $socialMediaEvidences = SocialMediaEvidenceData::collect($items);

        return $this->respond($request, 'social-media-evidence/index', [
            'socialMediaEvidences' => $socialMediaEvidences,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }
    public function create(): Response
    {
        return Inertia::render('social-media-evidence/create');
    }
    public function show(SocialMediaEvidence $socialMediaEvidence): Response
    {
        return Inertia::render('social-media-evidence/show', [
            'record' => SocialMediaEvidenceData::fromModel($socialMediaEvidence)->toArray(),
        ]);
    }
    public function edit(SocialMediaEvidence $socialMediaEvidence): Response
    {
        return Inertia::render('social-media-evidence/edit', [
            'record' => SocialMediaEvidenceData::fromModel($socialMediaEvidence)->toArray(),
        ]);
    }
    public function store(SocialMediaEvidenceData $socialMediaEvidenceData): RedirectResponse
    {
        $socialMediaEvidence = SocialMediaEvidence::create($socialMediaEvidenceData->toArray());
        return redirect()
            ->route('social-media-evidences.index', $socialMediaEvidence)
            ->with('flash.success', 'SocialMediaEvidence created.');
    }
    public function update(SocialMediaEvidenceData $socialMediaEvidenceData, SocialMediaEvidence $socialMediaEvidence): RedirectResponse
    {
        $socialMediaEvidence->update($socialMediaEvidenceData->toArray());
        return redirect()
            ->route('social-media-evidences.index', $socialMediaEvidence)
            ->with('flash.success', 'SocialMediaEvidence updated.');
    }
    public function destroy(SocialMediaEvidence $socialMediaEvidence): RedirectResponse
    {
        $socialMediaEvidence->delete();
        return redirect()
            ->route('social-media-evidences.index')
            ->with('flash.success', 'SocialMediaEvidence deleted.');
    }
    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('deleteAny', SocialMediaEvidence::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = SocialMediaEvidence::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

}
