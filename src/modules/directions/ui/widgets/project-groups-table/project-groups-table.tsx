"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, BarChart3, FolderOpen } from "lucide-react";

import type { ProjectGroup } from "@/modules/directions/schemas/project-group.schema";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui";

type ProjectGroupsTableProps = {
  groups: ProjectGroup[];
};

const columns: ColumnDef<ProjectGroup>[] = [
  {
    header: "ID",
    accessorKey: "id",
    cell: ({ getValue }) => (
      <span className="tabular-nums text-[#566a7f]">{getValue<number>()}</span>
    ),
  },
  {
    header: "Название",
    accessorKey: "name",
    cell: ({ getValue }) => (
      <span className="truncate text-[#2f2b3d]">{getValue<string>()}</span>
    ),
  },
  {
    header: "Ответственный",
    accessorKey: "ownerName",
    cell: ({ getValue }) => (
      <span className="text-[#566a7f]">{getValue<string>()}</span>
    ),
  },
  {
    header: "Проекты",
    accessorKey: "projectsCount",
    cell: ({ getValue }) => (
      <span className="tabular-nums font-semibold text-[#696cff]">
        {getValue<number>()}
      </span>
    ),
  },
  {
    header: "",
    id: "actions",
    cell: () => (
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1 rounded-lg border-neutral-200 text-xs text-[#566a7f]"
        >
          <FolderOpen className="size-3.5" />
          Проекты
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1 rounded-lg border-neutral-200 text-xs text-[#566a7f]"
        >
          <BarChart3 className="size-3.5" />
          Дэшборд
          <ArrowUpRight className="size-3.5" />
        </Button>
      </div>
    ),
  },
];

export function ProjectGroupsTable({ groups }: ProjectGroupsTableProps) {
  return (
    <DataTable<ProjectGroup>
      columns={columns}
      data={groups}
      searchPlaceholder="Поиск по названию или ответственному…"
    />
  );
}
