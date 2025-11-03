<?php

namespace App\Http\Controllers;

use App\Data\User\UserData;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\QueryFilters\DateRangeFilter;
use App\QueryFilters\MultiColumnSearchFilter;
use App\Support\RoleEnum;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends BaseResourceController {
    use AuthorizesRequests;

    protected string $modelClass = User::class;
    protected array $allowedFilters = ['created_at', 'email', 'name', 'role', 'search', 'updated_at', 'username'];
    protected array $allowedSorts = ['created_at', 'email', 'id', 'name', 'role', 'updated_at', 'username'];
    protected array $allowedIncludes = [];
    protected array $defaultIncludes = [];
    protected array $defaultSorts = ['-created_at'];

    public function __construct() {
        $this->authorizeResource(User::class, 'user');
    }

    protected function filters(): array {
        return [
            'email',
            'name',
            'username',
            'role',
            MultiColumnSearchFilter::make(['name', 'email', 'username']),
            DateRangeFilter::make('created_at'),
            DateRangeFilter::make('updated_at'),
        ];
    }

    public function index(Request $request): Response|JsonResponse {
        $query = $this->buildIndexQuery($request);

        $items = $query
            ->paginate($request->input('per_page'))
            ->appends($request->query());

        $users = UserData::collect($items);

        return $this->respond($request, 'user/index', [
            'users' => $users,
            'filters' => $request->only($this->allowedFilters),
            'filteredData' => [],
            'sort' => (string) $request->query('sort', $this->defaultSorts[0] ?? '-created_at'),
            'roles' => $this->availableRoles(),
            'roleLabels' => $this->roleLabels(),
            'can' => [
                'create' => $request->user()->can('create', User::class),
            ],
        ]);
    }

    public function create(): Response {
        return Inertia::render('user/create', [
            'roles' => $this->availableRoles(),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse {
        $attributes = Arr::except($request->validated(), ['password_confirmation']);

        User::create([
            'name' => $attributes['name'],
            'username' => Str::lower($attributes['username']),
            'email' => $attributes['email'],
            'role' => $attributes['role'],
            'password' => $attributes['password'],
        ]);

        return redirect()
            ->route('users.index')
            ->with('flash.success', 'Pengguna berhasil dibuat.');
    }

    public function show(User $user): Response {
        return Inertia::render('user/show', [
            'record' => UserData::fromModel($user)->toArray(),
            'roleLabels' => $this->roleLabels(),
        ]);
    }

    public function edit(User $user): Response {
        return Inertia::render('user/edit', [
            'record' => UserData::fromModel($user)->toArray(),
            'roles' => $this->availableRoles(),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse {
        $attributes = Arr::except($request->validated(), ['password_confirmation']);

        if (blank($attributes['password'] ?? null)) {
            unset($attributes['password']);
        }

        if (isset($attributes['username'])) {
            $attributes['username'] = Str::lower((string) $attributes['username']);
        }

        $user->update($attributes);

        return redirect()
            ->route('users.index')
            ->with('flash.success', 'Pengguna berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user): RedirectResponse {
        if ($request->user()?->is($user)) {
            return redirect()
                ->route('users.index')
                ->with('flash.error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $user->delete();

        return redirect()
            ->route('users.index')
            ->with('flash.success', 'Pengguna berhasil dihapus.');
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function availableRoles(): array {
        $user = request()->user();

        $roles = collect(RoleEnum::cases());

        if ($user?->role === RoleEnum::Admin->value) {
            $roles = $roles->filter(fn (RoleEnum $role) => $role === RoleEnum::Employee);
        }

        return $roles
            ->map(fn (RoleEnum $role) => [
                'value' => $role->value,
                'label' => $role->label(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, string>
     */
    private function roleLabels(): array {
        return collect(RoleEnum::cases())
            ->mapWithKeys(fn (RoleEnum $role) => [$role->value => $role->label()])
            ->all();
    }
}
