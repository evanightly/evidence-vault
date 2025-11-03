<?php

namespace Database\Factories;

use App\Models\DigitalEvidence;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\DigitalEvidence>
 */
class DigitalEvidenceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(),
            'filepath' => fake()->sentence(),
            'user_id' => User::factory(),
        ];
    }
}
