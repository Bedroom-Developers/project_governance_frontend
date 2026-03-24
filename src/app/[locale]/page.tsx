import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, getAuthenticatedUserById } from "@/shared/lib/auth";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const isAuthenticated = Boolean(
    getAuthenticatedUserById(cookieStore.get(AUTH_COOKIE_NAME)?.value),
  );

  redirect(`/${locale}/${isAuthenticated ? "directions" : "login"}`);
}
