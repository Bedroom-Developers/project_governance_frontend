import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { type Direction, DirectionsGrid } from "@/modules/directions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("directions");
  return { title: t("title") };
}

export default async function DirectionsPage() {
  const t = await getTranslations("directions");

  const directions: Direction[] = [
    {
      id: "1231",
      name: "БН2 Развитие инфраструктуры",
      ownerName: "Ербол Садыр",
      projectGroupsCount: 4,
      projectsCount: 19,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {t("title")}
        </h1>
        <div className="mt-1 text-sm text-neutral-500">{t("empty")}</div>
      </div>

      <DirectionsGrid directions={directions} />
    </div>
  );
}
