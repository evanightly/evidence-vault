<?php

namespace Database\Factories;

use App\Models\Logbook;
use App\Models\LogbookEvidence;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\LogbookEvidence>
 */
class LogbookEvidenceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'filepath' => fake()->sentence(),
            'logbook_id' => Logbook::factory(),
        ];
    }
}
