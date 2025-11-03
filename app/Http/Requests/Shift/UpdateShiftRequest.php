<?php

namespace App\Http\Requests\Shift;

use App\Models\Shift;
use App\Models\User;
use App\Models\WorkLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

class UpdateShiftRequest extends FormRequest {
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool {
        $user = Auth::user();

        /** @var WorkLocation|null $workLocation */
        $workLocation = Route::current()?->parameter('work_location');

        /** @var Shift|null $shift */
        $shift = Route::current()?->parameter('shift');

        return $user instanceof User
            && $workLocation instanceof WorkLocation
            && $shift instanceof Shift
            && $shift->work_location_id === $workLocation->getKey()
            && $user->can('update', $workLocation);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        return [
            'name' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array {
        return [
            'name' => 'nama shift',
            'start_time' => 'waktu mulai',
            'end_time' => 'waktu selesai',
        ];
    }
}
