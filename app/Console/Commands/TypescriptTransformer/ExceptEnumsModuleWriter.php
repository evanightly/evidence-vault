<?php

namespace App\Console\Commands\TypescriptTransformer;

use Exception;
use Spatie\TypeScriptTransformer\Structures\TransformedType;
use Spatie\TypeScriptTransformer\Structures\TypesCollection;
use Spatie\TypeScriptTransformer\Writers\Writer;

class ExceptEnumsModuleWriter implements Writer
{
    public function format(TypesCollection $collection): string
    {
        $output = '';

        $iterator = $collection->getIterator();

        $iterator->uasort(function (TransformedType $a, TransformedType $b) {
            return strcmp($a->name, $b->name);
        });

        $enums = [];

        foreach ($iterator as $type) {
            /** @var \Spatie\TypeScriptTransformer\Structures\TransformedType $type */
            if ($type->isInline) {
                continue;
            }

            if ($type->keyword === 'enum') {
                $enums[] = $type->name;

                continue;
            }

            $output .= "export {$type->toString()}".PHP_EOL;
        }

        if ($enums) {
            $enumsImportOutput = 'import { '.implode(', ', $enums).' } from "'.$this->relativePathToEnumsDefinition().'";'.PHP_EOL.PHP_EOL;
        }

        return ($enumsImportOutput ?? '').$output;
    }

    public function replacesSymbolsWithFullyQualifiedIdentifiers(): bool
    {
        return false;
    }

    private function relativePathToEnumsDefinition(): string
    {
        $from = config('typescript-transformer.output_file');
        $to = config('typescript-transformer.enum_output_file');

        if (! is_string($from) || ! is_string($to)) {
            throw new Exception('Cannot resolve relative path between configurations [typescript-transformer.output_file] and [typescript-transformer.enum_output_file].');
        }

        $from = str_replace('\\', '/', $from);
        $to = str_replace('\\', '/', $to);

        if ($from == $to) {
            throw new Exception('The following path should be different: [typescript-transformer.output_file] and [typescript-transformer.enum_output_file].');
        }

        // Split the paths into arrays
        $fromParts = explode('/', $from);
        $toParts = explode('/', $to);

        // Find the point where the paths diverge
        $i = 0;
        while (isset($fromParts[$i], $toParts[$i]) && $fromParts[$i] === $toParts[$i]) {
            $i++;
        }

        // Go up as many levels as necessary
        $up = array_fill(0, count($fromParts) - $i - 1, '..');

        // Descend into the destination path
        $down = array_slice($toParts, $i);

        // Build the relative path
        $relativePath = implode('/', array_merge($up, $down));

        // If the relative path does not start with "..", prepend "./"
        if (! str_starts_with($relativePath, '..')) {
            $relativePath = "./{$relativePath}";
        }

        return $relativePath;
    }
}
