"use client";

import * as React from "react";

import { MilestonesClient } from "./milestones-client";
import {
  DEFAULT_PROJECTS,
  loadFromStorage,
  PROJECTS_STORAGE_KEY,
  type ProjectsByGroupKey,
} from "@/shared/lib/directions-storage";

export function MilestonesPageClient({
  directionId,
  groupId,
  projectId,
}: {
  directionId: string;
  groupId: string;
  projectId: string;
}) {
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [projectsByGroupKey, setProjectsByGroupKey] =
    React.useState<ProjectsByGroupKey>(DEFAULT_PROJECTS);

  React.useEffect(() => {
    setProjectsByGroupKey(loadFromStorage(PROJECTS_STORAGE_KEY, DEFAULT_PROJECTS));
    setIsHydrated(true);
  }, []);

  const key = `${directionId}-${groupId}`;
  const project = (projectsByGroupKey[key] ?? []).find(
    (item) => String(item.id) === String(projectId),
  );

  if (!isHydrated) {
    return (
      <div className="rounded-xl border border-neutral-200/70 bg-white p-6 text-sm text-neutral-500">
        Загрузка проекта...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-xl border border-neutral-200/70 bg-white p-6 text-sm text-neutral-500">
        Проект не найден.
      </div>
    );
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
