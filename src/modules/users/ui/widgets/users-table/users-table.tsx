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
        <span className="truncate font-semibold text-[#1f2f40]">
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
              ? "bg-[#0b74b8]/10 text-[#085f96]"
              : row.original.systemRole === ("moderator" as UsersSystemRole)
                ? "bg-[#eef2f6] text-[#4e6276]"
                : "bg-[#f4f7fa] text-[#4e6276]"
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
          <div className="text-sm font-semibold text-[#1f2f40]">
            {row.original.organization} / {row.original.department}
          </div>
          <div className="mt-0.5 truncate text-xs text-[#5f6f81]">
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
                  className="truncate text-sm text-[#4e6276]"
                >
                  <span className="font-semibold text-[#1f2f40]">
                    {p.projectName}
                  </span>
                  {": "}
                  <span className="font-medium text-[#5f6f81]">
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
                <span className="inline-flex w-full items-center justify-start gap-2 rounded-md border border-[#dbe5ef] bg-white px-3 py-1.5 text-xs font-semibold text-[#3f556c] hover:bg-[#f5f8fb]">
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
