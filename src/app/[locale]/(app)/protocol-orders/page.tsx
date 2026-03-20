import type { Metadata } from "next";

import { ProtocolOrdersPageClient } from "./protocol-orders-page-client";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Протокольные поручения" };
}

export default function ProtocolOrdersPage() {
  return <ProtocolOrdersPageClient />;
}