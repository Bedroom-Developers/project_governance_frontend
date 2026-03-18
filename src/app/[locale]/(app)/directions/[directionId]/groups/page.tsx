import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { ProjectGroup } from "@/modules/directions/schemas/project-group.schema";
import { ProjectGroupsTable } from "@/modules/directions/ui/widgets/project-groups-table/project-groups-table";

const MOCK_GROUPS: Record<string, ProjectGroup[]> = {
  "1231": [
    {
      id: 664,
      name: "Общая инфраструктура",
      ownerName: "Камария Кажгалиева",
      projectsCount: 2,
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Группы проектов" };
}

export default async function ProjectGroupsPage({
  params,
}: {
  params: Promise<{ directionId: string }>;
}) {
  const { directionId } = await params;
  const groups = MOCK_GROUPS[directionId] ?? [];

  if (!groups.length) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Группы проектов
      </h1>
      <ProjectGroupsTable groups={groups} directionId={directionId} />
    </div>
  );
}
