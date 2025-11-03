<?php

namespace App\Http\Controllers;

use App\Data\Logbook\LogbookData;
use App\Data\User\UserData;
use App\Data\WorkLocation\WorkLocationData;
use App\Http\Requests\Logbook\StoreLogbookRequest;
use App\Http\Requests\Logbook\UpdateLogbookRequest;
use App\Jobs\PublishLogbookToDrive;
use App\Models\Logbook;
use App\Models\LogbookEvidence;
use App\Models\Shift;
use App\Models\WorkLocation;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LogbookController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = Logbook::class;
    protected array $allowedFilters = ['additional_notes', 'created_at', 'date', 'search', 'shift_id', 'technician_id', 'updated_at', 'work_location_id'];
    protected array $allowedSorts = ['additional_notes', 'created_at', 'date', 'id', 'shift_id', 'technician_id', 'updated_at', 'work_location_id'];
    protected array $allowedIncludes = ['shift', 'technician', 'work_location'];
    protected array $defaultIncludes = ['shift', 'technician', 'work_location'];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(Logbook::class, 'logbook');
    }

    protected function filters(): array {
        return [
            'additional_notes',
            'shift_id',
            'technician_id',
            'work_location_id',
            MultiColumnSearchFilter::make(['additional_notes']),
            DateRangeFilter::make('created_at'),
            DateRangeFilter::make('date'),
            DateRangeFilter::make('updated_at'),
        ];
    }

    public function index(Request $request): Response|JsonResponse {
        $filteredData = [];

        $query = $this->buildIndexQuery($request);

        $items = $query
            ->paginate($request->input('per_page'))
            ->appends($request->query());

        $logbooks = LogbookData::collect($items);

        return $this->respond($request, 'logbook/index', [
            'logbooks' => $logbooks,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => $filteredData,
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
        ]);
    }

    public function create(Request $request): Response {
        $workLocations = WorkLocation::query()
            ->with(['shifts' => fn ($query) => $query->orderBy('start_time')])
            ->orderBy('name')
            ->get();

        $workLocationPayload = $workLocations
            ->map(fn (WorkLocation $workLocation) => WorkLocationData::fromModel($workLocation)->toArray())
            ->all();

        $technician = $request->user();

        return Inertia::render('logbook/create', [
            'workLocations' => $workLocationPayload,
            'defaultDate' => now()->format('Y-m-d'),
            'technician' => $technician ? UserData::fromModel($technician)->toArray() : null,
            'maxAttachmentSizeMb' => (int) config('logbook.max_attachment_size_mb', 20),
        ]);
    }

    public function show(Logbook $logbook): Response {
        $logbook->load([
            'technician',
            'work_location',
            'shift',
            'work_details',
            'evidences',
        ]);

        return Inertia::render('logbook/show', [
            'record' => LogbookData::fromModel($logbook)->toArray(),
        ]);
    }

    public function edit(Logbook $logbook): Response {
        $logbook->load([
            'technician',
            'work_location',
            'shift',
            'work_details',
            'evidences',
        ]);

        $workLocations = WorkLocation::query()
            ->with(['shifts' => fn ($query) => $query->orderBy('start_time')])
            ->orderBy('name')
            ->get();

        $workLocationPayload = $workLocations
            ->map(fn (WorkLocation $workLocation) => WorkLocationData::fromModel($workLocation)->toArray())
            ->all();

        return Inertia::render('logbook/edit', [
            'record' => LogbookData::fromModel($logbook)->toArray(),
            'workLocations' => $workLocationPayload,
            'maxAttachmentSizeMb' => (int) config('logbook.max_attachment_size_mb', 20),
        ]);
    }

    public function store(StoreLogbookRequest $request): RedirectResponse {
        $validated = $request->validated();
        $workDetails = $this->sanitizeWorkDetails($validated['work_details'] ?? []);

        if (empty($workDetails)) {
            throw ValidationException::withMessages([
                'work_details' => 'Minimal satu detail pekerjaan harus diisi.',
            ]);
        }

        $shiftId = $validated['shift_id'] ?? null;
        $workLocationId = (int) $validated['work_location_id'];

        $this->assertShiftMatchesLocation($shiftId, $workLocationId);

        /** @var Logbook $logbook */
        $logbook = DB::transaction(function () use ($validated, $workDetails, $shiftId, $workLocationId) {
            $logbook = Logbook::query()->create([
                'date' => $validated['date'],
                'additional_notes' => $validated['additional_notes'] ?? null,
                'technician_id' => Auth::id(),
                'work_location_id' => $workLocationId,
                'shift_id' => $shiftId,
            ]);

            $logbook->work_details()->createMany(
                collect($workDetails)->map(fn (string $description) => ['description' => $description])->all()
            );

            $this->storeEvidenceAttachments($logbook, $validated['evidences'] ?? null);

            return $logbook;
        });

        if (config('logbook.drive.enabled')) {
            PublishLogbookToDrive::dispatch($logbook->getKey())->afterCommit();
        }

        return redirect()
            ->route('logbooks.show', $logbook)
            ->with('flash.success', 'Logbook berhasil dibuat.');
    }

    public function update(UpdateLogbookRequest $request, Logbook $logbook): RedirectResponse {
        $validated = $request->validated();

        $hasWorkDetails = array_key_exists('work_details', $validated);

        $requestedWorkDetails = $hasWorkDetails
            ? ($validated['work_details'] ?? [])
            : null;

        $workDetails = $this->sanitizeWorkDetails($requestedWorkDetails);

        if (empty($workDetails) && !$hasWorkDetails) {
            $existingDetails = $logbook->work_details()
                ->pluck('description')
                ->map(fn (?string $description) => is_string($description) ? trim($description) : '')
                ->filter(fn (string $description) => $description !== '')
                ->values()
                ->all();

            $workDetails = $existingDetails;
        }

        if (empty($workDetails)) {
            throw ValidationException::withMessages([
                'work_details' => 'Minimal satu detail pekerjaan harus diisi.',
            ]);
        }

        $date = array_key_exists('date', $validated)
            ? $validated['date']
            : $logbook->date?->format('Y-m-d');

        if ($date === null) {
            throw ValidationException::withMessages([
                'date' => 'Tanggal logbook tidak valid.',
            ]);
        }

        $workLocationId = array_key_exists('work_location_id', $validated)
            ? (int) $validated['work_location_id']
            : (int) $logbook->work_location_id;

        $shiftId = array_key_exists('shift_id', $validated)
            ? ($validated['shift_id'] ?? null)
            : ($logbook->shift_id !== null ? (int) $logbook->shift_id : null);

        $this->assertShiftMatchesLocation($shiftId, $workLocationId);

        $additionalNotes = array_key_exists('additional_notes', $validated)
            ? ($validated['additional_notes'] ?? null)
            : $logbook->additional_notes;

        DB::transaction(function () use ($logbook, $validated, $workDetails, $shiftId, $workLocationId, $date, $additionalNotes) {
            $logbook->update([
                'date' => $date,
                'additional_notes' => $additionalNotes,
                'work_location_id' => $workLocationId,
                'shift_id' => $shiftId,
            ]);

            $logbook->work_details()->delete();
            $logbook->work_details()->createMany(
                collect($workDetails)->map(fn (string $description) => ['description' => $description])->all()
            );

            $this->storeEvidenceAttachments($logbook, $validated['evidences'] ?? null);
        });

        if (config('logbook.drive.enabled')) {
            PublishLogbookToDrive::dispatch($logbook->getKey())->afterCommit();
        }

        return redirect()
            ->route('logbooks.show', $logbook)
            ->with('flash.success', 'Logbook berhasil diperbarui.');
    }

    public function destroy(Logbook $logbook): RedirectResponse {
        DB::transaction(function () use ($logbook) {
            $logbook->load(['work_details', 'evidences']);

            $this->purgeEvidenceAttachments($logbook);

            $logbook->work_details()->delete();

            $logbook->delete();
        });

        return redirect()
            ->route('logbooks.index')
            ->with('flash.success', 'Logbook serta seluruh bukti kegiatan berhasil dihapus.');
    }

    public function bulkDelete(Request $request): JsonResponse {
        $this->authorize('deleteAny', Logbook::class);

        $payload = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $deletedCount = Logbook::query()
            ->whereIn('id', $payload['ids'])
            ->delete();

        return response()->json([
            'message' => sprintf('Successfully deleted %d selected items.', $deletedCount),
            'deleted_count' => $deletedCount,
        ]);
    }

    /**
     * @param  array<int, string>|null  $details
     * @return array<int, string>
     */
    private function sanitizeWorkDetails(?array $details): array {
        return collect($details ?? [])
            ->map(fn ($value) => is_string($value) ? trim($value) : '')
            ->filter(fn ($value) => $value !== '')
            ->values()
            ->all();
    }

    /**
     * @param  array<int, UploadedFile>|UploadedFile|null  $files
     */
    private function storeEvidenceAttachments(Logbook $logbook, array|UploadedFile|null $files): void {
        if ($files instanceof UploadedFile) {
            $files = [$files];
        }

        if (!is_array($files) || count($files) === 0) {
            return;
        }

        $disk = config('logbook.attachments_disk', 'public');
        $root = trim((string) config('logbook.attachments_root', 'logbooks'), '/');

        foreach ($files as $file) {
            if (!$file instanceof UploadedFile) {
                continue;
            }

            $path = $file->store(sprintf('%s/%s/%s', $root, $logbook->getKey(), 'evidences'), $disk);

            LogbookEvidence::query()->create([
                'logbook_id' => $logbook->getKey(),
                'filepath' => $path,
            ]);
        }
    }

    private function assertShiftMatchesLocation(?int $shiftId, int $workLocationId): void {
        if ($shiftId === null) {
            return;
        }

        $exists = Shift::query()
            ->whereKey($shiftId)
            ->where('work_location_id', $workLocationId)
            ->exists();

        if (!$exists) {
            throw ValidationException::withMessages([
                'shift_id' => 'Shift tidak sesuai dengan lokasi kerja yang dipilih.',
            ]);
        }
    }

    private function purgeEvidenceAttachments(Logbook $logbook): void {
        $disk = config('logbook.attachments_disk', 'public');
        $root = trim((string) config('logbook.attachments_root', 'logbooks'), '/');
        $directory = $root !== ''
            ? sprintf('%s/%s', $root, $logbook->getKey())
            : (string) $logbook->getKey();

        $filesystem = Storage::disk($disk);

        $paths = $logbook->evidences
            ->map(static fn ($attachment) => $attachment?->filepath)
            ->filter()
            ->values();

        if ($paths->isNotEmpty()) {
            $filesystem->delete($paths->all());
        }

        $logbook->evidences()->delete();

        if ($directory !== '' && $filesystem->exists($directory)) {
            $filesystem->deleteDirectory($directory);
        }
    }
}
