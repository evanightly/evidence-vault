<?php

namespace App\Http\Requests\Logbook;

use App\Models\Logbook;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateLogbookRequest extends FormRequest {
    public function authorize(): bool {
        /** @var Logbook|null $logbook */
        $logbook = $this->route('logbook');
        $user = Auth::user();

        return $logbook !== null
            ? ($user?->can('update', $logbook) ?? false)
            : ($user?->can('create', Logbook::class) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array {
        $maxSizeKb = (int) config('logbook.max_attachment_size_kb', 20 * 1024);
        $allowedMimes = config('logbook.allowed_mimes', []);
        $fileRules = ['file', 'max:' . $maxSizeKb];

        if (!empty($allowedMimes)) {
            $fileRules[] = 'mimes:' . implode(',', $allowedMimes);
        }

        return [
            'date' => ['sometimes', 'required', 'date_format:Y-m-d'],
            'additional_notes' => ['nullable', 'string'],
            'work_location_id' => ['sometimes', 'required', 'integer', 'exists:work_locations,id'],
            'shift_id' => ['sometimes', 'nullable', 'integer', 'exists:shifts,id'],
            'work_details' => ['sometimes', 'array', 'min:1'],
            'work_details.*' => ['nullable', 'string', 'max:1000'],
            'evidences' => ['nullable', 'array'],
            'evidences.*' => $fileRules,
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array {
        $maxSizeMb = (int) config('logbook.max_attachment_size_mb', 20);

        return [
            'work_details.required' => 'Minimal satu detail pekerjaan harus diisi.',
            'work_details.*.required' => 'Detail pekerjaan tidak boleh kosong.',
            'work_details.*.max' => 'Detail pekerjaan maksimal 1000 karakter.',
            'evidences.*.max' => (string) sprintf('Ukuran berkas maksimal %d MB per file.', $maxSizeMb),
        ];
    }
}
