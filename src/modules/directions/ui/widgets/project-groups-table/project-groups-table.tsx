"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { FolderOpen, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ProjectGroup } from "@/modules/directions/schemas/project-group.schema";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui";
import { Link } from "@/shared/configs/i18/navigation";

type ProjectGroupsTableProps = {
  groups: ProjectGroup[];
  directionId: string;
  canDelete?: boolean;
  onDelete?: (groupId: number) => void;
};

function createColumns(
  directionId: string,
  t: ReturnType<typeof useTranslations>,
  canDelete: boolean,
  onDelete?: (groupId: number) => void,
): ColumnDef<ProjectGroup>[] {
  return [
    {
      header: t("headers.id"),
      accessorKey: "id",
      cell: ({ getValue }) => (
        <span className="tabular-nums text-[#566a7f]">
          {getValue<number>()}
        </span>
      ),
    },
    {
      header: t("headers.name"),
      accessorKey: "name",
      cell: ({ getValue }) => (
        <span className="truncate text-[#2f2b3d]">{getValue<string>()}</span>
      ),
    },
    {
      header: t("headers.owner"),
      accessorKey: "ownerName",
      cell: ({ getValue }) => (
        <span className="text-[#566a7f]">{getValue<string>()}</span>
      ),
    },
    {
      header: t("headers.projects"),
      accessorKey: "projectsCount",
      cell: ({ getValue }) => (
        <span className="tabular-nums font-semibold text-[#00BFFF]">
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
              className="h-8 gap-1 rounded-xl border-[#00BFFF]/25 px-3 text-xs font-medium text-[#0099cc] hover:bg-[#00BFFF]/10"
            >
              <Link
                href={`/directions/${directionId}/groups/${group.id}/projects`}
                className="inline-flex items-center gap-1 whitespace-nowrap"
              >
                <FolderOpen className="size-3.5" />
                {t("actions.projects")}
              </Link>
            </Button>
            {canDelete && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(group.id)}
                className="inline-flex h-8 items-center gap-1 rounded-xl border border-red-200 px-3 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
                aria-label={t("actions.delete")}
                title={t("actions.delete")}
              >
                <Trash2 className="size-3.5" />
                {t("actions.delete")}
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];
}

export function ProjectGroupsTable({
  groups,
  directionId,
  canDelete = false,
  onDelete,
}: ProjectGroupsTableProps) {
  const t = useTranslations("groupsTable");
  return (
    <DataTable<ProjectGroup>
      columns={createColumns(directionId, t, canDelete, onDelete)}
      data={groups}
      searchPlaceholder={t("searchPlaceholder")}
    />
  );
}
