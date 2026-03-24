import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ProtocolOrdersPageClient } from "./protocol-orders-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "protocolOrders" });

  return { title: t("loadingTitle") };
}

export default function ProtocolOrdersPage() {
  return <ProtocolOrdersPageClient />;
}