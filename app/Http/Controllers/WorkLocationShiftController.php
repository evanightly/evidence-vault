<?php

namespace App\Http\Controllers;

use App\Http\Requests\Shift\StoreShiftRequest;
use App\Http\Requests\Shift\UpdateShiftRequest;
use App\Models\Shift;
use App\Models\WorkLocation;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;

class WorkLocationShiftController extends Controller {
    use AuthorizesRequests;

    public function store(StoreShiftRequest $request, WorkLocation $workLocation): RedirectResponse {
        $this->authorize('update', $workLocation);

        $workLocation->shifts()->create($request->validated());

        return redirect()
            ->route('work-locations.show', $workLocation)
            ->with('flash.success', 'Shift berhasil ditambahkan.');
    }

    public function update(UpdateShiftRequest $request, WorkLocation $workLocation, Shift $shift): RedirectResponse {
        $this->authorize('update', $workLocation);

        if ($shift->work_location_id !== $workLocation->getKey()) {
            abort(404);
        }

        $shift->update($request->validated());

        return redirect()
            ->route('work-locations.show', $workLocation)
            ->with('flash.success', 'Shift berhasil diperbarui.');
    }

    public function destroy(WorkLocation $workLocation, Shift $shift): RedirectResponse {
        $this->authorize('update', $workLocation);

        if ($shift->work_location_id !== $workLocation->getKey()) {
            abort(404);
        }

        $shift->delete();

        return redirect()
            ->route('work-locations.show', $workLocation)
            ->with('flash.success', 'Shift berhasil dihapus.');
    }
}
