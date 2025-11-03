<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Routing\Controller as BaseController;
abstract class BaseResourceController extends BaseController
{
    protected string $modelClass;
    protected array $allowedFilters = [];
    protected array $allowedSorts = [];
    protected array $allowedIncludes = [];
    protected array $defaultIncludes = [];
    protected array $defaultSorts = ['-created_at'];

    /**
     * Override to supply extra AllowedFilter callbacks or custom filters.
     */
    protected function filters(): array
    {
        return $this->allowedFilters;
    }

    /**
     * Hook for child controllers to supply complex / callback sorts.
     */
    protected function extraSorts(): array
    {
        return [];
    }

    protected function baseQuery(Request $request): QueryBuilder
    {
        return QueryBuilder::for($this->modelClass)
            ->allowedFilters($this->filters())
            ->allowedSorts(array_merge($this->allowedSorts, $this->extraSorts()))
            ->allowedIncludes($this->allowedIncludes)
            ->with($this->defaultIncludes);
    }

    protected function buildIndexQuery(Request $request): QueryBuilder
    {
        $query = $this->baseQuery($request);

        if (!empty($this->defaultSorts)) {
            foreach ($this->defaultSorts as $sort) {
                $query->defaultSort($sort);
            }
        }

        return $query;
    }

    protected function respond(Request $request, string $component, array $data): Response|JsonResponse
    {
        if ($request->wantsJson()) {
            return response()->json($data['resource'] ?? $data['items'] ?? $data['notes'] ?? $data);
        }

        return Inertia::render($component, $data);
    }
}
