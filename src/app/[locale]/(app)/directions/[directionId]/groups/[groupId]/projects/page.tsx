import type { Metadata } from "next";

import type { Project } from "@/modules/directions/schemas/project.schema";
import { ProjectsGrid } from "@/modules/directions/ui/widgets/projects-grid/projects-grid";

const MOCK_PROJECTS: Record<string, Project[]> = {
  "healthcare-663": [
    {
      id: 1,
      name: "Цифровизация процесса приёма граждан",
      lastUpdated: "2026-02-14T10:00:00Z",
      ownerName: "Камария Кажгалиева",
      stage: "execution",
      stagePercent: 55,
      region: "г. Семей",
      tasksTotal: 24,
      tasksDone: 13,
      participants: 8,
    },
    {
      id: 2,
      name: "Внедрение единого реестра обращений",
      lastUpdated: "2026-02-10T08:30:00Z",
      ownerName: "Бауржан Шакабасов",
      stage: "planning",
      stagePercent: 35,
      region: "Аягозский район",
      tasksTotal: 16,
      tasksDone: 6,
      participants: 5,
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Проекты группы" };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ directionId: string; groupId: string }>;
}) {
  const { directionId, groupId } = await params;
  const key = `${directionId}-${groupId}`;
  const projects = MOCK_PROJECTS[key] ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Проекты группы
      </h1>
      <ProjectsGrid projects={projects} />
    </div>
  );
}
