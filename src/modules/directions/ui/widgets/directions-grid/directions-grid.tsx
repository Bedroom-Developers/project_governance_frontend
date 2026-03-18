"use client";

import { useLocale, useTranslations } from "next-intl";

import type { Direction } from "@/modules/directions/schemas/direction.schema";
import { Card, CardContent } from "@/shared/components/ui";
import { Link } from "@/shared/configs/i18/navigation";
import { cn } from "@/shared/lib/utils";

type DirectionsGridProps = {
  directions: Direction[];
  className?: string;
};

export function DirectionsGrid({ directions, className }: DirectionsGridProps) {
  const t = useTranslations("directions.cards");
  const locale = useLocale();
  const formatCount = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {directions.map((direction) => (
        <Link
          key={direction.id}
          href={`/directions/${direction.id}/groups`}
          className="block"
        >
          <Card
            className={cn(
              "rounded-xl border border-neutral-200/80 bg-white shadow-[0_4px_18px_rgba(34,48,62,0.08)]",
              "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(34,48,62,0.14)]",
            )}
          >
            <CardContent className="pt-2.5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold leading-snug text-[#2f2b3d]">
                    {direction.name}
                  </div>
                  <div className="mt-2 text-xs text-[#a1acb8]">
                    {t("owner")}:{" "}
                    <span className="font-semibold text-[#566a7f]">
                      {direction.ownerName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-neutral-200/70 bg-white px-3 pb-2.5 pt-2 shadow-[0_1px_0_rgba(34,48,62,0.04)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                    {t("projectGroups")}
                  </div>
                  <div className="mt-0.5 text-lg font-semibold text-[#696cff]">
                    {formatCount(direction.projectGroupsCount)}
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-200/70 bg-white px-3 pb-2.5 pt-2 shadow-[0_1px_0_rgba(34,48,62,0.04)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                    {t("projects")}
                  </div>
                  <div className="mt-0.5 text-lg font-semibold text-[#2f2b3d]">
                    {formatCount(direction.projectsCount)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
