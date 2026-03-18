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
      name: "Здравоохранение",
      ownerName: "Айгүл Сарсенова",
      projectGroupsCount: 38,
      projectsCount: 10310,
    },
    {
      id: "digitalization",
      name: "Цифровизация",
      ownerName: "Ернар Ахметов",
      projectGroupsCount: 9,
      projectsCount: 95,
    },
    {
      id: "education",
      name: "Образование",
      ownerName: "Динара Кожахмет",
      projectGroupsCount: 9,
      projectsCount: 191,
    },
    {
      id: "infrastructure",
      name: "Инфраструктура и дороги",
      ownerName: "Нурлан Бектуров",
      projectGroupsCount: 0,
      projectsCount: 0,
    },
    {
      id: "economy",
      name: "Экономика и инвестиции",
      ownerName: "Алия Толеуова",
      projectGroupsCount: 0,
      projectsCount: 0,
    },
    {
      id: "social",
      name: "Социальная политика",
      ownerName: "Серик Жуматаев",
      projectGroupsCount: 0,
      projectsCount: 0,
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
