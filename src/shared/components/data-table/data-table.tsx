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
          <input
            className="h-10 w-full max-w-md rounded-lg border border-neutral-200 bg-white px-4 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-[#696cff]/30"
            placeholder={searchPlaceholder}
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
          />
        </div>
      ) : null}

      <div className="rounded-xl border border-neutral-200/80 bg-white shadow-[0_4px_18px_rgba(34,48,62,0.06)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 bg-[#f5f5f9] px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#a1acb8]"
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
                      className="border-t border-neutral-100 px-4 py-3 text-sm text-[#2f2b3d]"
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
                  className="h-20 px-4 text-center text-sm text-neutral-500"
                >
                  Нет данных.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4 text-sm text-[#a1acb8]">
          <div>
            Страница {table.getState().pagination.pageIndex + 1} из{" "}
            {table.getPageCount() || 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-[#566a7f] disabled:opacity-40"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Назад
            </button>
            <button
              type="button"
              className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-[#566a7f] disabled:opacity-40"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
