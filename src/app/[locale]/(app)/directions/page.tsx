import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DirectionsPageClient } from "./directions-page-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("directions");
  return { title: t("title") };
}

export default async function DirectionsPage() {
  await getTranslations("directions");
  return <DirectionsPageClient />;
}
