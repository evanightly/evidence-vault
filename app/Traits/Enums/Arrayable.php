<?php

namespace App\Traits\Enums;

trait Arrayable {
    public static function toArray() {
        return array_column(self::cases(), 'value');
    }
}
