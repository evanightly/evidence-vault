<?php

namespace Database\Factories;

use App\Models\Logbook;
use App\Models\LogbookWorkDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\LogbookWorkDetail>
 */
class LogbookWorkDetailFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'description' => fake()->sentence(),
            'logbook_id' => Logbook::factory(),
        ];
    }
}
