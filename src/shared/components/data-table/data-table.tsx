"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui";
import { cn } from "@/shared/lib/utils";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchPlaceholder?: string;
  className?: string;
};

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder,
  className,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className={cn("space-y-4", className)}>
      {searchPlaceholder ? (
        <div className="flex justify-between gap-3">
          <Input
            className="h-10 w-full max-w-md rounded-md border-border bg-background"
            placeholder={searchPlaceholder}
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 bg-muted/35 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="border-t border-border/70 px-4 py-3 text-sm text-foreground"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-20 px-4 text-center text-sm text-muted-foreground"
                >
                  Нет данных.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <div>
            Страница {table.getState().pagination.pageIndex + 1} из{" "}
            {table.getPageCount() || 1}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-md"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-md"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Вперёд
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
