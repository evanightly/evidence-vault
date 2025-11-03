<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkLocation;
use App\Support\RoleEnum;
use Illuminate\Auth\Access\HandlesAuthorization;

class WorkLocationPolicy {
    use HandlesAuthorization;

    public function before(User $user, string $ability): ?bool {
        if ($user->role === RoleEnum::SuperAdmin->value) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool {
        return $this->isAdmin($user);
    }

    public function view(User $user, WorkLocation $workLocation): bool {
        return $this->isAdmin($user);
    }

    public function create(User $user): bool {
        return $this->isAdmin($user);
    }

    public function update(User $user, WorkLocation $workLocation): bool {
        return $this->isAdmin($user);
    }

    public function delete(User $user, WorkLocation $workLocation): bool {
        return $this->isAdmin($user);
    }

    public function deleteAny(User $user): bool {
        return $this->isAdmin($user);
    }

    public function restore(User $user, WorkLocation $workLocation): bool {
        return false;
    }

    public function forceDelete(User $user, WorkLocation $workLocation): bool {
        return false;
    }

    private function isAdmin(User $user): bool {
        return $user->role === RoleEnum::Admin->value;
    }
}
