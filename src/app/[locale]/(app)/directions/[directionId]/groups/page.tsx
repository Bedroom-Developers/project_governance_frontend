import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { ProjectGroup } from "@/modules/directions/schemas/project-group.schema";
import { ProjectGroupsTable } from "@/modules/directions/ui/widgets/project-groups-table/project-groups-table";

const MOCK_GROUPS: Record<string, ProjectGroup[]> = {
  healthcare: [
    {
      id: 663,
      name: "Цифровизация",
      ownerName: "Камария Кажгалиева",
      projectsCount: 7,
    },
    {
      id: 662,
      name: "Повышение правопорядка",
      ownerName: "Камария Кажгалиева",
      projectsCount: 5,
    },
  ],
  digitalization: [
    {
      id: 659,
      name: "Повышение квалификации госаппарата",
      ownerName: "Камария Кажгалиева",
      projectsCount: 4,
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
      <ProjectGroupsTable groups={groups} />
    </div>
  );
}
