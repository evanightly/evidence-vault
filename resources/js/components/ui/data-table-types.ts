export type FilterType = 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange' | 'boolean' | 'selector' | 'custom';

export interface FilterOption {
    label: string;
    value: string;
}

export interface CustomFilterProps extends React.HTMLAttributes<HTMLDivElement> {
    column: {
        id: string;
        header?: string;
    };
    value: any;
    onChange: (value: any) => void;
    onClear: () => void;
}

export interface ColumnFilter {
    type: FilterType;
    options?: FilterOption[]; // For select/multiselect filters
    placeholder?: string;
    min?: number; // For number/numberrange filters
    max?: number; // For number/numberrange filters
    step?: number; // For number filters
    // For selector filters
    fetchDataUrl?: string; // API endpoint to fetch data from
    labelKey?: string; // Key to use for displaying labels (default: 'name')
    searchPlaceholder?: string; // Placeholder for search input
    dataMapper?: (response: unknown) => Array<Record<string, unknown>> | undefined; // Optional mapper to convert API responses into selector items
    // For custom filters
    component?: React.ComponentType<CustomFilterProps>; // Custom filter component
    getDisplayValue?: (value: any) => string | null; // Custom display value function
    // Generic value mapping (e.g., IDs -> labels) when getDisplayValue not supplied.
    // Provide a key referencing DataTable.filteredData[valueMapKey] which should be an array of objects.
    valueMapKey?: string;
    idField?: string; // defaults to 'id'
    labelField?: string; // defaults to 'name'
}

// We are now using TanStack's native ColumnDef directly. To keep our custom filter metadata
// we define a light augmentation shape that can be merged onto ColumnDef objects.
export interface ColumnFilterMeta {
    enableFiltering?: boolean;
    filterOnly?: boolean; // if true, not rendered in table body/header
    filter?: ColumnFilter;
}

export interface DataTableAction<TData = any> {
    label: string;
    onClick: (row: TData) => void;
    variant?: 'default' | 'destructive';
    icon?: React.ComponentType<{ className?: string }>;
}

export type DataTableBulkAction<TData = any> = (props: { selectedRows: TData[] }) => React.ReactNode;

export interface PaginationMeta {
    current_page: number;
    data: any[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface ActiveFilter {
    column: string;
    type: FilterType;
    value: any;
    label?: string;
}

export interface DataTableFilters {
    [key: string]: any;
    search?: string;
    sort?: string;
    columnFilters?: Record<string, any>; // Individual column filters
    per_page?: number;
    page?: number;
}