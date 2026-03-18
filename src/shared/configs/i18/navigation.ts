import { createNavigation } from "next-intl/navigation";

import { routing } from "@/shared/configs/i18/routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
