import { useState, useCallback, useMemo } from 'react';

// Sort configuration
export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

// Filter configuration
export type FilterValue = Set<string>;
export type Filters = Record<string, FilterValue>;

// Pagination configuration
export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

export interface UseListViewOptions<T> {
  initialSortKey?: keyof T;
  initialSortDirection?: 'asc' | 'desc';
  initialFilters?: Filters;
  initialLimit?: number;
}

export interface UseListViewReturn<T> {
  // Selection
  selectedIds: Set<string>;
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  toggleItem: (id: string) => void;
  selectAll: (ids: string[]) => void;
  deselectAll: () => void;
  isSelected: (id: string) => boolean;
  selectedCount: number;

  // Sorting
  sortConfig: SortConfig<T> | null;
  setSortConfig: (config: SortConfig<T> | null) => void;
  handleSort: (key: keyof T) => void;

  // Filtering
  filters: Filters;
  setFilter: (key: string, value: FilterValue) => void;
  toggleFilterValue: (key: string, value: string) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Pagination
  pagination: PaginationConfig;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  totalPages: number;

  // Bulk actions
  isBulkMode: boolean;
  enterBulkMode: () => void;
  exitBulkMode: () => void;

  // View mode
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;

  // Sort helper for data
  sortData: (data: T[]) => T[];

  // Filter helper for data
  filterData: (data: T[], filterFn: (item: T, filters: Filters) => boolean) => T[];

  // Search helper for data
  searchData: (data: T[], searchFn: (item: T, query: string) => boolean) => T[];
}

export function useListView<T extends { id: string }>(
  options: UseListViewOptions<T> = {}
): UseListViewReturn<T> {
  const {
    initialSortKey,
    initialSortDirection = 'desc',
    initialFilters = {},
    initialLimit = 20,
  } = options;

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    initialSortKey ? { key: initialSortKey, direction: initialSortDirection } : null
  );

  // Filter state
  const [filters, setFilters] = useState<Filters>(initialFilters);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    limit: initialLimit,
    total: 0,
  });

  // Bulk mode state
  const [isBulkMode, setIsBulkMode] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Selection handlers
  const selectItem = useCallback((id: string) => {
    setSelectedIds((prev) => new Set(prev).add(id));
  }, []);

  const deselectItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const selectedCount = selectedIds.size;

  // Sort handlers
  const handleSort = useCallback(
    (key: keyof T) => {
      setSortConfig((prev) => {
        if (prev?.key === key) {
          return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
        }
        return { key, direction: 'asc' };
      });
    },
    []
  );

  // Filter handlers
  const setFilter = useCallback((key: string, value: FilterValue) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleFilterValue = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const current = prev[key] || new Set();
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return { ...prev, [key]: next };
    });
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((f) => f.size > 0),
    [filters]
  );

  // Pagination handlers
  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setTotal = useCallback((total: number) => {
    setPagination((prev) => ({ ...prev, total }));
  }, []);

  const totalPages = useMemo(
    () => Math.ceil(pagination.total / pagination.limit) || 1,
    [pagination.total, pagination.limit]
  );

  // Bulk mode handlers
  const enterBulkMode = useCallback(() => {
    setIsBulkMode(true);
  }, []);

  const exitBulkMode = useCallback(() => {
    setIsBulkMode(false);
    setSelectedIds(new Set());
  }, []);

  // Data helpers
  const sortData = useCallback(
    (data: T[]): T[] => {
      if (!sortConfig) return data;

      return [...data].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        const comparison = aVal < bVal ? -1 : 1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    },
    [sortConfig]
  );

  const filterData = useCallback(
    (data: T[], filterFn: (item: T, filters: Filters) => boolean): T[] => {
      if (!hasActiveFilters) return data;
      return data.filter((item) => filterFn(item, filters));
    },
    [filters, hasActiveFilters]
  );

  const searchData = useCallback(
    (data: T[], searchFn: (item: T, query: string) => boolean): T[] => {
      if (!searchQuery.trim()) return data;
      return data.filter((item) => searchFn(item, searchQuery));
    },
    [searchQuery]
  );

  return {
    // Selection
    selectedIds,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    isSelected,
    selectedCount,

    // Sorting
    sortConfig,
    setSortConfig,
    handleSort,

    // Filtering
    filters,
    setFilter,
    toggleFilterValue,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,

    // Search
    searchQuery,
    setSearchQuery,

    // Pagination
    pagination,
    setPage,
    setLimit,
    setTotal,
    totalPages,

    // Bulk actions
    isBulkMode,
    enterBulkMode,
    exitBulkMode,

    // View mode
    viewMode,
    setViewMode,

    // Data helpers
    sortData,
    filterData,
    searchData,
  };
}
