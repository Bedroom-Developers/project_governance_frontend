import type { Metadata } from "next";
import { MilestonesPageClient } from "./milestones-page-client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Вехи проекта" };
}

export default async function ProjectMilestonesPage({
  params,
}: {
  params: Promise<{ directionId: string; groupId: string; projectId: string }>;
}) {
  const { directionId, groupId, projectId } = await params;
  return (
    <MilestonesPageClient
      directionId={directionId}
      groupId={groupId}
      projectId={projectId}
    />
  );
}
