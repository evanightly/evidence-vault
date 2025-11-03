<?php

use App\Models\User;
use App\Support\RoleEnum;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows super admin to view user index', function () {
    $superAdmin = User::factory()->superAdmin()->create();

    $response = $this->actingAs($superAdmin)->get(route('users.index'));

    $response->assertOk();
});

it('forbids non super admin from viewing user index', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $response = $this->actingAs($user)->get(route('users.index'));

    $response->assertForbidden();
})->with([
    RoleEnum::Admin->value,
    RoleEnum::Employee->value,
]);

it('allows super admin to create users with roles', function () {
    $superAdmin = User::factory()->superAdmin()->create();

    $payload = [
        'name' => 'Pengguna Baru',
        'username' => 'pengguna_baru',
        'email' => 'pengguna@example.com',
        'role' => RoleEnum::Admin->value,
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ];

    $response = $this->actingAs($superAdmin)->post(route('users.store'), $payload);

    $response->assertRedirect(route('users.index'));

    $this->assertDatabaseHas('users', [
        'username' => 'pengguna_baru',
        'email' => 'pengguna@example.com',
        'role' => RoleEnum::Admin->value,
    ]);
});

it('allows admin to create employee users', function () {
    $admin = User::factory()->admin()->create();

    $payload = [
        'name' => 'Karyawan Baru',
        'username' => 'karyawan_baru',
        'email' => 'karyawan@example.com',
        'role' => RoleEnum::Employee->value,
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ];

    $response = $this->actingAs($admin)->post(route('users.store'), $payload);

    $response->assertRedirect(route('users.index'));

    $this->assertDatabaseHas('users', [
        'username' => 'karyawan_baru',
        'email' => 'karyawan@example.com',
        'role' => RoleEnum::Employee->value,
    ]);
});

it('prevents admin from assigning non employee roles when creating users', function () {
    $admin = User::factory()->admin()->create();

    $payload = [
        'name' => 'Coba Admin',
        'username' => 'coba_admin',
        'email' => 'coba-admin@example.com',
        'role' => RoleEnum::Admin->value,
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ];

    $response = $this->actingAs($admin)
        ->from(route('users.create'))
        ->post(route('users.store'), $payload);

    $response->assertRedirect(route('users.create'));
    $response->assertSessionHasErrors('role');

    $this->assertDatabaseMissing('users', ['email' => 'coba-admin@example.com']);
});

it('forbids employees from creating users', function () {
    $actor = User::factory()->create(['role' => RoleEnum::Employee->value]);

    $payload = [
        'name' => 'Pengguna Baru',
        'username' => 'pengguna_employee',
        'email' => 'pengguna@example.com',
        'role' => RoleEnum::Employee->value,
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ];

    $response = $this->actingAs($actor)->post(route('users.store'), $payload);

    $response->assertForbidden();

    $this->assertDatabaseMissing('users', ['email' => 'pengguna@example.com']);
});

it('allows super admin to update users without changing password when left blank', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $user = User::factory()->create([
        'role' => RoleEnum::Employee->value,
    ]);
    $originalHash = $user->getAuthPassword();

    $payload = [
        'name' => 'Nama Diperbarui',
        'username' => 'nama_diperbarui',
        'email' => 'ubah@example.com',
        'role' => RoleEnum::Admin->value,
        'password' => '',
        'password_confirmation' => '',
    ];

    $response = $this->actingAs($superAdmin)->put(route('users.update', $user), $payload);

    $response->assertRedirect(route('users.index'));

    $user->refresh();

    expect($user->name)->toBe('Nama Diperbarui');
    expect($user->username)->toBe('nama_diperbarui');
    expect($user->email)->toBe('ubah@example.com');
    expect($user->role)->toBe(RoleEnum::Admin->value);
    expect($user->getAuthPassword())->toBe($originalHash);
});

it('allows super admin to delete other users', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    $user = User::factory()->create();

    $response = $this->actingAs($superAdmin)->delete(route('users.destroy', $user));

    $response->assertRedirect(route('users.index'));
    $this->assertModelMissing($user);
});

it('prevents users from deleting their own account', function () {
    $superAdmin = User::factory()->superAdmin()->create();

    $response = $this->actingAs($superAdmin)->delete(route('users.destroy', $superAdmin));

    $response->assertRedirect(route('users.index'));
    $this->assertModelExists($superAdmin->fresh());
});
