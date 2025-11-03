<?php

namespace App\Console\Commands\TypescriptTransformer;

use Illuminate\Console\Command;
use Spatie\TypeScriptTransformer\Formatters\PrettierFormatter;
use Spatie\TypeScriptTransformer\Structures\TransformedType;
use Spatie\TypeScriptTransformer\TypeScriptTransformer;
use Spatie\TypeScriptTransformer\TypeScriptTransformerConfig;
use Spatie\TypeScriptTransformer\Writers\ModuleWriter;
use Spatie\TypeScriptTransformer\Writers\TypeDefinitionWriter;

class CustomTransformCommand extends Command
{
    protected $signature = 'typescript:custom-transform
                            {--format : Use Prettier to format the output}';

    protected $description = 'Map PHP types to TypeScript, separating enums and non-enums into different files.';

    public function handle(TypeScriptTransformerConfig $config): int
    {
        if ($this->option('format')) {
            $config->formatter(PrettierFormatter::class);
        }

        // Export non-enums first
        $transformer = new TypeScriptTransformer(
            $config
                ->outputFile(config('typescript-transformer.output_file')) // @phpstan-ignore-line
                ->writer(TypeDefinitionWriter::class) // can be writed `->writer(ExceptEnumsModuleWriter::class)`
        );
        $transformer->transform();

        // Then export only enums
        $config
            ->outputFile(config('typescript-transformer.enum_output_file')) // @phpstan-ignore-line
            ->writer(OnlyEnumsModuleWriter::class);

        $transformer = new TypeScriptTransformer($config);

        /** @var \Illuminate\Support\Collection<string, \Spatie\TypeScriptTransformer\Structures\TransformedType> $collection */
        $collection = collect($transformer->transform());

        $this->table(
            ['PHP class', 'TypeScript entity'],
            $collection->map(fn (TransformedType $type, string $class) => [
                $class, $type->getTypeScriptName(),
            ])
        );

        $this->info("Transformed {$collection->count()} PHP types to TypeScript");

        return 0;
    }
}
