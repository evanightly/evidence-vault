<?php

namespace App\Policies;

use App\Models\User;
use App\Support\RoleEnum;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy {
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool {
        if ($user->role === RoleEnum::SuperAdmin->value) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool {
        return false;
    }

    public function view(User $user, User $target): bool {
        return false;
    }

    public function create(User $user): bool {
        return $user->role === RoleEnum::Admin->value;
    }

    public function update(User $user, User $target): bool {
        return false;
    }

    public function delete(User $user, User $target): bool {
        return false;
    }

    public function deleteAny(User $user): bool {
        return false;
    }

    public function restore(User $user, User $target): bool {
        return false;
    }

    public function forceDelete(User $user, User $target): bool {
        return false;
    }
}
