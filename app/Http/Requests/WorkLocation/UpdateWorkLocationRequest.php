<?php

namespace App\Http\Requests\WorkLocation;

use App\Models\User;
use App\Models\WorkLocation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;

class UpdateWorkLocationRequest extends FormRequest {
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool {
        $user = Auth::user();

        /** @var WorkLocation|null $workLocation */
        $workLocation = Route::current()?->parameter('work_location');

        return $user instanceof User && $workLocation instanceof WorkLocation && $user->can('update', $workLocation);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        /** @var WorkLocation|null $workLocation */
        $workLocation = Route::current()?->parameter('work_location');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique(WorkLocation::class, 'name')->ignore($workLocation?->getKey())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array {
        return [
            'name' => 'nama lokasi',
        ];
    }
}
