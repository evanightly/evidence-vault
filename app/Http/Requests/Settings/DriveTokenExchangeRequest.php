<?php

namespace App\Http\Requests\Settings;

use App\Support\RoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class DriveTokenExchangeRequest extends FormRequest {
    public function authorize(): bool {
        $user = Auth::user();

        return $user !== null && $user->role === RoleEnum::SuperAdmin->value;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        return [
            'code' => ['required', 'string', 'min:6', 'max:255'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array {
        return [
            'code.required' => 'Masukkan kode verifikasi dari Google.',
            'code.string' => 'Kode verifikasi harus berupa teks.',
            'code.min' => 'Kode verifikasi tampaknya terlalu pendek.',
            'code.max' => 'Kode verifikasi terlalu panjang.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array {
        return [
            'code' => 'kode verifikasi',
        ];
    }
}
