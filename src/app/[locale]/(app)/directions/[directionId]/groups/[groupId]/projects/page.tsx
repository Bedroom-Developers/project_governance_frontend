import type { Metadata } from "next";
import { ProjectsPageClient } from "./projects-page-client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Проекты группы" };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ directionId: string; groupId: string }>;
}) {
  const { directionId, groupId } = await params;
  return <ProjectsPageClient directionId={directionId} groupId={groupId} />;
}
