<?php

namespace App\QueryFilters;

use Spatie\QueryBuilder\AllowedFilter;

/**
 * Normalized date range filter supporting scalar values and array ranges.
 */
class DateRangeFilter
{
    public static function make(string $column): AllowedFilter
    {
        return AllowedFilter::callback($column, function ($query, $value) use ($column): void {
            if ($value === null || $value === '') {
                return;
            }

            if (is_array($value)) {
                if (!array_is_list($value)) {
                    $from = isset($value['from']) ? trim((string) $value['from']) : null;
                    $to = isset($value['to']) ? trim((string) $value['to']) : null;
                } else {
                    [$from, $to] = $value + [null, null];
                    $from = $from !== null ? trim((string) $from) : null;
                    $to = $to !== null ? trim((string) $to) : null;
                }

                if ($from && $to) {
                    $query->whereBetween($column, [
                        $from . ' 00:00:00',
                        $to . ' 23:59:59',
                    ]);
                    return;
                }

                if ($from) {
                    $query->where($column, '>=', $from . ' 00:00:00');
                    return;
                }

                if ($to) {
                    $query->where($column, '<=', $to . ' 23:59:59');
                }

                return;
            }

            $date = trim((string) $value);

            if ($date === '') {
                return;
            }

            $query->whereDate($column, $date);
        });
    }
}