import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { Project } from "@/modules/directions/schemas/project.schema";
import { MilestonesClient } from "./milestones-client";

const MOCK_PROJECTS: Record<string, Project[]> = {
  "1231-663": [
    {
      id: 1,
      name: "Модернизация транспортных узлов области",
      lastUpdated: "2026-02-14T10:00:00Z",
      ownerName: "Камария Кажгалиева",
      stage: "done",
      stagePercent: 100,
      region: "г. Семей",
      tasksTotal: 24,
      tasksDone: 13,
      participants: 8,
    },
    {
      id: 2,
      name: "Развитие дорожной сети и безопасности движения",
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
  "1231-662": [
    {
      id: 1,
      name: "Модернизация водоснабжения и очистных сооружений",
      lastUpdated: "2026-02-14T10:00:00Z",
      ownerName: "Камария Кажгалиева",
      stage: "done",
      stagePercent: 100,
      region: "г. Семей",
      tasksTotal: 24,
      tasksDone: 13,
      participants: 8,
    },
    {
      id: 2,
      name: "Энергоэффективность: модернизация электросетей",
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
  "1231-664": [
    {
      id: 1,
      name: "Строительство спортивного комплекса г. Аягоз (ул. Шакенова)",
      lastUpdated: "2026-02-20T09:15:00Z",
      ownerName: "Камария Кажгалиева",
      stage: "execution",
      stagePercent: 80,
      region: "г. Аягоз",
      tasksTotal: 10,
      tasksDone: 3,
      participants: 6,
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Вехи проекта" };
}

export default async function ProjectMilestonesPage({
  params,
}: {
  params: Promise<{ directionId: string; groupId: string; projectId: string }>;
}) {
  const { directionId, groupId, projectId } = await params;

  // В текущих моках ключ строится по аналогии со списками групп/проектов.
  const key = `${directionId === "infrastructure" ? "1231" : directionId}-${groupId}`;
  const projects = MOCK_PROJECTS[key] ?? [];
  const project = projects.find((p) => p.id === Number(projectId));

  if (!project) {
    notFound();
  }

  return (
    <MilestonesClient
      directionId={directionId}
      groupId={groupId}
      projectId={projectId}
      project={project}
    />
  );
}
