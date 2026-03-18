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
      id: "healthcare",
      name: "БН5 Типовое базовое направление",
      ownerName: "Ербол Садыр",
      projectGroupsCount: 6,
      projectsCount: 42,
    },
    {
      id: "digitalization",
      name: "БН4 Человеческий капитал",
      ownerName: "Ербол Садыр",
      projectGroupsCount: 5,
      projectsCount: 31,
    },
    {
      id: "education",
      name: "БН3 АПК и Экология",
      ownerName: "Ербол Садыр",
      projectGroupsCount: 7,
      projectsCount: 58,
    },
    {
      id: "infrastructure",
      name: "БН2 Развитие инфраструктуры",
      ownerName: "Ербол Садыр",
      projectGroupsCount: 4,
      projectsCount: 19,
    },
    {
      id: "economy",
      name: "БН1 Предпринимательство индустрия",
      ownerName: "Ербол Садыр",
      projectGroupsCount: 3,
      projectsCount: 16,
    },
    {
      id: "social",
      name: "Социальная политика",
      ownerName: "Серик Жуматаев",
      projectGroupsCount: 4,
      projectsCount: 27,
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
