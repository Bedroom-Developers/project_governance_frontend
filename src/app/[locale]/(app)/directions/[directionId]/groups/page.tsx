import type { Metadata } from "next";
import { GroupsPageClient } from "./groups-page-client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Группы проектов" };
}

export default async function ProjectGroupsPage({
  params,
}: {
  params: Promise<{ directionId: string }>;
}) {
  const { directionId } = await params;
  return <GroupsPageClient directionId={directionId} />;
}
