<?php

namespace App\Http\Requests\Dashboard;

use App\Models\DigitalEvidence;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreDigitalEvidenceRequest extends FormRequest {
    public function authorize(): bool {
        $user = Auth::user();

        return $user instanceof User && $user->can('create', DigitalEvidence::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array {
        $maxKb = (int) config('logbook.max_attachment_size_kb', 20 * 1024);
        $allowedMimes = config('logbook.allowed_mimes', ['jpg', 'jpeg', 'png', 'webp']);
        $mimeRule = $allowedMimes !== []
            ? 'mimes:' . implode(',', $allowedMimes)
            : 'mimetypes:image/jpeg,image/png,image/webp';

        return [
            'name' => ['nullable', 'string', 'max:255'],
            'file' => [
                'required',
                'file',
                'max:' . $maxKb,
                $mimeRule,
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array {
        return [
            'name' => 'nama berkas',
            'file' => 'berkas',
        ];
    }
}
