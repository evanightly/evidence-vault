<?php

namespace App\Console\Commands\TypescriptTransformer;

use Spatie\TypeScriptTransformer\Structures\TransformedType;
use Spatie\TypeScriptTransformer\Structures\TypesCollection;
use Spatie\TypeScriptTransformer\Writers\Writer;

class OnlyEnumsModuleWriter implements Writer
{
    public function format(TypesCollection $collection): string
    {
        $output = '';

        /** @var \ArrayIterator $iterator */
        $iterator = $collection->getIterator();

        $iterator->uasort(function (TransformedType $a, TransformedType $b) {
            return strcmp($a->name, $b->name);
        });

        foreach ($iterator as $type) {
            /** @var \Spatie\TypeScriptTransformer\Structures\TransformedType $type */
            if ($type->isInline) {
                continue;
            }

            if ($type->keyword !== 'enum') {
                continue;
            }

            $output .= "export {$type->toString()}".PHP_EOL;
        }

        return $output;
    }

    public function replacesSymbolsWithFullyQualifiedIdentifiers(): bool
    {
        return false;
    }
}
