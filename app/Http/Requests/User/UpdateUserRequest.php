<?php

namespace App\Http\Requests\User;

use App\Models\User;
use App\Support\RoleEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        /** @var User|null $user */
        $user = Route::current()?->parameter('user');
        $shouldValidatePassword = filled(request()->input('password'));

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)->ignore($user?->getKey())],
            'username' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique(User::class)->ignore($user?->getKey())],
            'role' => ['required', 'string', Rule::in(RoleEnum::toArray())],
            'password' => ['nullable', 'confirmed', Rule::when($shouldValidatePassword, [Password::default()])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array {
        return [
            'name' => 'nama',
            'email' => 'email',
            'username' => 'username',
            'role' => 'peran',
            'password' => 'kata sandi',
        ];
    }
}
