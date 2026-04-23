"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BulkAction<TData> = {
  label: string;
  variant?: "default" | "destructive";
  action: (selectedRows: TData[]) => void | Promise<void>;
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumn?: string;
  filterControls?: React.ReactNode;
  bulkActions?: BulkAction<TData>[];
  pageSize?: number;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function selectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search…",
  searchColumn,
  filterControls,
  bulkActions,
  pageSize = 25,
  isLoading,
  emptyState,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState(
    searchParams.get("q") ?? ""
  );
  const [pageIndex, setPageIndex] = useState(
    Math.max(0, Number(searchParams.get("page") ?? 1) - 1)
  );

  // Sync URL on search/page change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (globalFilter) {
      params.set("q", globalFilter);
      params.set("page", "1");
    } else {
      params.delete("q");
    }
    if (pageIndex > 0) {
      params.set("page", String(pageIndex + 1));
    } else {
      params.delete("page");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter, pageIndex]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, rowSelection, columnVisibility, globalFilter, pagination: { pageIndex, pageSize } },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: (v) => { setGlobalFilter(v); setPageIndex(0); },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const hasSelection = selectedRows.length > 0;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-8 w-64 text-[13px]"
        />
        {filterControls}
        {hasSelection && bulkActions && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12px] text-muted">{selectedRows.length} selected</span>
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant === "destructive" ? "destructive" : "outline"}
                className="h-7 text-[12px]"
                onClick={() => {
                  action.action(selectedRows);
                  setRowSelection({});
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-line overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-bg-soft hover:bg-bg-soft">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        "text-[12px] font-semibold text-muted py-2",
                        canSort && "cursor-pointer select-none hover:text-ink"
                      )}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-muted/60">
                            {sorted === "asc" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : sorted === "desc" ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronsUpDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="text-[13px] hover:bg-bg-soft/60"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-16 text-center">
                  {emptyState ?? (
                    <p className="text-[13px] text-muted">No results found.</p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-[12px] text-muted">
        <span>
          {table.getFilteredRowModel().rows.length} row
          {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
          {hasSelection ? ` · ${selectedRows.length} selected` : ""}
        </span>
        <div className="flex items-center gap-2">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPageIndex((p) => p + 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
