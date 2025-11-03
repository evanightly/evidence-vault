<?php

namespace Database\Factories;

use App\Models\Logbook;
use App\Models\Shift;
use App\Models\User;
use App\Models\WorkLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Logbook>
 */
class LogbookFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'date' => fake()->date(),
            'additional_notes' => fake()->sentence(),
            'technician_id' => User::factory(),
            'work_location_id' => WorkLocation::factory(),
            'shift_id' => Shift::factory(),
        ];
    }
}
