"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { DataTable } from "@/shared/components/data-table/data-table";
import type {
  UserDetailsDialogItem,
  UsersSystemRole,
} from "../user-details-dialog/user-details-dialog";
import { UserDetailsDialog } from "../user-details-dialog/user-details-dialog";

type UsersTableUser = UserDetailsDialogItem;

type UsersTableProps = {
  items: UsersTableUser[];
  className?: string;
};

function createColumns(): ColumnDef<UsersTableUser>[] {
  return [
    {
      header: "ФИО",
      accessorKey: "fio",
      cell: ({ getValue }) => (
        <span className="truncate text-[#2f2b3d] font-semibold">
          {getValue<string>()}
        </span>
      ),
    },
    {
      header: "Роль",
      accessorKey: "systemRole",
      cell: ({ row }) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
            row.original.systemRole === ("admin" as UsersSystemRole)
              ? "bg-[#eef1ff] text-[#696cff]"
              : row.original.systemRole === ("moderator" as UsersSystemRole)
                ? "bg-[#f5f5f9] text-[#6b7280]"
                : "bg-neutral-50 text-[#4b5563]"
          }`}
        >
          {row.original.systemRole === ("admin" as UsersSystemRole)
            ? "Администратор"
            : row.original.systemRole === ("moderator" as UsersSystemRole)
              ? "Модератор"
              : "Пользователь"}
        </span>
      ),
    },
    {
      header: "Место работы",
      accessorKey: "department",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#2f2b3d]">
            {row.original.organization} / {row.original.department}
          </div>
          <div className="mt-0.5 text-xs text-[#566a7f] truncate">
            {row.original.position}
          </div>
        </div>
      ),
    },
    {
      header: "Доступы",
      accessorKey: "projects",
      cell: ({ row }) => {
        const projects = row.original.projects;
        const visible = projects.slice(0, 2);
        const restCount = Math.max(projects.length - visible.length, 0);

        return (
          <div className="flex flex-col gap-2">
            <div className="min-w-0">
              {visible.map((p, idx) => (
                <div
                  key={`${p.projectName}-${idx}`}
                  className="truncate text-sm text-[#4b5563]"
                >
                  <span className="font-semibold text-[#2f2b3d]">
                    {p.projectName}
                  </span>
                  {": "}
                  <span className="text-[#566a7f] font-medium">
                    {p.projectRole}
                  </span>
                </div>
              ))}
              {restCount > 0 ? (
                <div className="text-xs text-[#9ca3af]">+{restCount} ещё</div>
              ) : null}
            </div>

            <UserDetailsDialog
              item={row.original}
              trigger={
                <span className="inline-flex w-full items-center justify-start gap-2 rounded-lg border border-neutral-200/70 bg-white px-3 py-1.5 text-xs font-semibold text-[#566a7f] shadow-[0_1px_0_rgba(34,48,62,0.04)] hover:bg-neutral-50">
                  Подробнее
                </span>
              }
            />
          </div>
        );
      },
    },
  ];
}

export function UsersTable({ items, className }: UsersTableProps) {
  const columns = React.useMemo(() => createColumns(), []);

  return (
    <div className={className}>
      <DataTable<UsersTableUser>
        columns={columns}
        data={items}
        searchPlaceholder="Поиск по ФИО, роли, отделу…"
      />
    </div>
  );
}
