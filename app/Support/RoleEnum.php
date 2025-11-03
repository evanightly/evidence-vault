<?php

namespace App\Support;

use App\Traits\Enums\Arrayable;

enum RoleEnum: string {
    use Arrayable;

    case SuperAdmin = 'SuperAdmin';
    case Admin = 'Admin';
    case Employee = 'Employee';

    public function label(): string {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Admin',
            self::Employee => 'Karyawan',
        };
    }
}
