"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, BarChart3, FolderOpen } from "lucide-react";

import type { ProjectGroup } from "@/modules/directions/schemas/project-group.schema";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui";
import { Link } from "@/shared/configs/i18/navigation";

type ProjectGroupsTableProps = {
  groups: ProjectGroup[];
  directionId: string;
};

function createColumns(directionId: string): ColumnDef<ProjectGroup>[] {
  return [
    {
      header: "ID",
      accessorKey: "id",
      cell: ({ getValue }) => (
        <span className="tabular-nums text-[#566a7f]">
          {getValue<number>()}
        </span>
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
      cell: ({ row }) => {
        const group = row.original as ProjectGroup;

        return (
          <div className="flex flex-wrap justify-end gap-2 whitespace-normal">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-lg border-neutral-200 px-2 text-xs text-[#566a7f]"
            >
              <Link
                href={`/directions/${directionId}/groups/${group.id}/projects`}
                className="inline-flex items-center gap-1 whitespace-nowrap"
              >
                <FolderOpen className="size-3.5" />
                Проекты
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-lg border-neutral-200 px-2 text-xs text-[#566a7f]"
            >
              <BarChart3 className="size-3.5" />
              Дэшборд
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];
}

export function ProjectGroupsTable({
  groups,
  directionId,
}: ProjectGroupsTableProps) {
  return (
    <DataTable<ProjectGroup>
      columns={createColumns(directionId)}
      data={groups}
      searchPlaceholder="Поиск по названию или ответственному…"
    />
  );
}
