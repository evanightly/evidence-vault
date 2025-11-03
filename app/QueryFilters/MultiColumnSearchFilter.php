<?php

namespace App\QueryFilters;

use Spatie\QueryBuilder\AllowedFilter;

/**
 * Build a LIKE search across multiple columns using a single filter key.
 * Accepts scalar or array search terms and ignores empty values.
 */
class MultiColumnSearchFilter
{
    /**
     * @param array<int, string> $columns
     */
    public static function make(array $columns, string $filterName = 'search'): AllowedFilter
    {
        return AllowedFilter::callback($filterName, function ($query, $value) use ($columns): void {
            if ($value === null || $value === '') {
                return;
            }

            $terms = is_array($value)
                ? array_filter(array_map(static fn ($term) => trim((string) $term), $value))
                : [trim((string) $value)];

            if ($terms === []) {
                return;
            }

            foreach ($terms as $term) {
                if ($term === '') {
                    continue;
                }

                $query->where(function ($builder) use ($columns, $term): void {
                    foreach ($columns as $column) {
                        $builder->orWhere($column, 'like', "%{$term}%");
                    }
                });
            }
        });
    }
}