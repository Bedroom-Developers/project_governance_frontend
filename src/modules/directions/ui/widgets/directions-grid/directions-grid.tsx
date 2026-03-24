"use client";

import { Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { Direction } from "@/modules/directions/schemas/direction.schema";
import { Card, CardContent } from "@/shared/components/ui";
import { Link } from "@/shared/configs/i18/navigation";
import { cn } from "@/shared/lib/utils";

type DirectionsGridProps = {
  directions: Direction[];
  canDelete?: boolean;
  onDelete?: (directionId: string) => void;
  className?: string;
};

export function DirectionsGrid({
  directions,
  canDelete = false,
  onDelete,
  className,
}: DirectionsGridProps) {
  const t = useTranslations("directions.cards");
  const locale = useLocale();
  const formatCount = (value: number) =>
    new Intl.NumberFormat(locale).format(value);

  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {directions.map((direction, i) => (
        <div
          key={direction.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <Card
            className={cn(
              "relative rounded-2xl bg-white shadow-[0_2px_16px_rgba(0,175,255,0.08)]",
              "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,175,255,0.18)] hover:scale-[1.02]",
            )}
          >
            {canDelete && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(direction.id)}
                className="absolute right-4 top-4 z-10 inline-flex size-9 items-center justify-center rounded-xl border border-red-200 bg-white/95 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                aria-label={t("delete")}
                title={t("delete")}
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}

            <Link href={`/directions/${direction.id}/groups`} className="block">
              <CardContent className="pt-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div className={cn("min-w-0", canDelete ? "pr-12" : "")}>
                    <div className="text-[15px] font-semibold leading-snug text-[#0a0a0f]">
                      {direction.name}
                    </div>
                    <div className="mt-2 text-xs text-[#0099cc]/70">
                      {t("owner")}:{" "}
                      <span className="font-semibold text-[#00BFFF]/90">
                        {direction.ownerName}
                      </span>
                    </div>
                    {direction.createdByName ? (
                      <div className="mt-1 text-xs text-[#6b7280]">
                        Инициатор:{" "}
                        <span className="font-medium text-[#374151]">
                          {direction.createdByName}
                        </span>
                      </div>
                    ) : null}
                    {direction.passportResponsibleName ? (
                      <div className="mt-1 text-xs text-[#6b7280]">
                        Паспорт проекта заполняет:{" "}
                        <span className="font-medium text-[#374151]">
                          {direction.passportResponsibleName}
                        </span>
                        {direction.passportResponsibleTitle ? (
                          <span className="text-[#9ca3af]">
                            {" "}
                            · {direction.passportResponsibleTitle}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-lg border border-[#00BFFF]/15 bg-[#f8fcff] px-3 pb-2.5 pt-2 shadow-[0_1px_0_rgba(0,175,255,0.04)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0099cc]/80">
                      {t("projectGroups")}
                    </div>
                    <div className="mt-0.5 text-lg font-semibold text-[#00BFFF]">
                      {formatCount(direction.projectGroupsCount)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#00BFFF]/10 bg-[#f8fcff] px-3 pb-2.5 pt-2 shadow-[0_1px_0_rgba(0,175,255,0.03)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0099cc]/80">
                      {t("projects")}
                    </div>
                    <div className="mt-0.5 text-lg font-semibold text-[#0a0a0f]">
                      {formatCount(direction.projectsCount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>
      ))}
    </div>
  );
}
