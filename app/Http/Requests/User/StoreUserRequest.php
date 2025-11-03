<?php

namespace App\Http\Requests\User;

use App\Models\User;
use App\Support\RoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest {
    public function authorize(): bool {
        $user = Auth::user();

        return $user instanceof User && $user->can('create', User::class);
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        $user = Auth::user();
        $allowedRoles = $user?->role === RoleEnum::Admin->value
            ? [RoleEnum::Employee->value]
            : RoleEnum::toArray();

        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique(User::class)],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'role' => ['required', 'string', Rule::in($allowedRoles)],
            'password' => ['required', 'confirmed', Password::default()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array {
        return [
            'name' => 'nama',
            'username' => 'username',
            'email' => 'email',
            'role' => 'peran',
            'password' => 'kata sandi',
        ];
    }
}
