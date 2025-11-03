<?php

namespace App\Policies;

use App\Models\LogbookEvidence;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class LogbookEvidencePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, LogbookEvidence $logbookEvidence): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, LogbookEvidence $logbookEvidence): bool
    {
        return true;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, LogbookEvidence $logbookEvidence): bool
    {
        return true;
    }

    /**
     * Determine whether the user can bulk delete models.
     */
    public function deleteAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, LogbookEvidence $logbookEvidence): bool
    {
        return true;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, LogbookEvidence $logbookEvidence): bool
    {
        return true;
    }
}
