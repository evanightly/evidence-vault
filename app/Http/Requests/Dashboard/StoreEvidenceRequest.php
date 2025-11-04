<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;

class StoreEvidenceRequest extends FormRequest {
    public function authorize(): bool {
        return Auth::check();
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string|null>
     */
    public function rules(): array {
        $maxKb = (int) config('logbook.max_attachment_size_kb', 20 * 1024);
        $allowedMimes = config('logbook.allowed_mimes', ['jpg', 'jpeg', 'png', 'webp']);
        $mimeRule = $allowedMimes !== []
            ? 'mimes:' . implode(',', $allowedMimes)
            : 'mimetypes:image/jpeg,image/png,image/webp';

        return [
            'digital_name' => ['nullable', 'string', 'max:255'],
            'digital_files' => ['nullable', 'array'],
            'digital_files.*' => ['file', 'max:' . $maxKb, $mimeRule],
            'social_name' => ['nullable', 'string', 'max:255'],
            'social_files' => ['nullable', 'array'],
            'social_files.*' => ['file', 'max:' . $maxKb, $mimeRule],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array {
        return [
            'digital_files.array' => 'Silakan pilih berkas bukti digital yang valid.',
            'digital_files.*.file' => 'Berkas bukti digital tidak valid.',
            'digital_files.*.max' => 'Ukuran bukti digital melebihi batas yang diizinkan.',
            'digital_files.*.mimes' => 'Format bukti digital harus berupa: jpg, jpeg, png, atau webp.',
            'digital_files.*.mimetypes' => 'Format bukti digital harus berupa gambar (JPG, JPEG, PNG, atau WEBP).',
            'social_files.array' => 'Silakan pilih berkas bukti medsos yang valid.',
            'social_files.*.file' => 'Berkas bukti medsos tidak valid.',
            'social_files.*.max' => 'Ukuran bukti medsos melebihi batas yang diizinkan.',
            'social_files.*.mimes' => 'Format bukti medsos harus berupa: jpg, jpeg, png, atau webp.',
            'social_files.*.mimetypes' => 'Format bukti medsos harus berupa gambar (JPG, JPEG, PNG, atau WEBP).',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array {
        return [
            'digital_name' => 'nama bukti digital',
            'digital_files' => 'berkas bukti digital',
            'digital_files.*' => 'berkas bukti digital',
            'social_name' => 'nama bukti medsos',
            'social_files' => 'berkas bukti medsos',
            'social_files.*' => 'berkas bukti medsos',
        ];
    }

    protected function withValidator(Validator $validator): void {
        $validator->after(function (Validator $validator): void {
            $files = request()->allFiles();
            $digital = $files['digital_files'] ?? [];
            $social = $files['social_files'] ?? [];

            $digitalCount = is_array($digital) ? count(array_filter($digital)) : ($digital ? 1 : 0);
            $socialCount = is_array($social) ? count(array_filter($social)) : ($social ? 1 : 0);

            if ($digitalCount === 0 && $socialCount === 0) {
                $validator->errors()->add('digital_files', 'Silakan pilih minimal satu berkas untuk diunggah.');
            }
        });
    }
}
