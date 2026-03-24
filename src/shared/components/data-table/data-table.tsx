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
            className="h-10 w-full max-w-md rounded-xl border border-[#00BFFF]/20 bg-white px-4 text-sm text-[#0a0a0f] outline-none placeholder:text-[#94a3b8] focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
            placeholder={searchPlaceholder}
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
          />
        </div>
      ) : null}

      <div className="animate-fade-in-up overflow-hidden rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,175,255,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_24px_rgba(0,175,255,0.12)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 bg-[#f8fcff] px-5 text-xs font-semibold uppercase tracking-wider text-[#566a7f]"
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
                      className="border-t border-[#00BFFF]/5 px-5 py-3.5 text-sm text-[#0a0a0f] transition-colors hover:bg-[#f8fcff]/50"
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
        <div className="flex items-center justify-between border-t border-[#00BFFF]/5 bg-[#f8fcff]/30 px-6 py-3.5 text-sm text-[#566a7f]">
          <div>
            Страница {table.getState().pagination.pageIndex + 1} из{" "}
            {table.getPageCount() || 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-[#00BFFF]/20 bg-white px-3.5 py-2 text-sm font-medium text-[#566a7f] transition-colors hover:bg-[#00BFFF]/5 disabled:opacity-40"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Назад
            </button>
            <button
              type="button"
              className="rounded-xl border border-[#00BFFF]/20 bg-white px-3.5 py-2 text-sm font-medium text-[#566a7f] transition-colors hover:bg-[#00BFFF]/5 disabled:opacity-40"
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
