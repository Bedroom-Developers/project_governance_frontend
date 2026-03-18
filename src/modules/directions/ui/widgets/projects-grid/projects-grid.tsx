"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarClock, MapPin, Users } from "lucide-react";

import type { Project } from "@/modules/directions/schemas/project.schema";
import { Card, CardContent } from "@/shared/components/ui";
import { SegmentProgress } from "@/shared/components/ui/segment-progress";
import { cn } from "@/shared/lib/utils";

type ProjectsGridProps = {
  projects: Project[];
  className?: string;
};

function formatDate(dateIso: string) {
  return format(new Date(dateIso), "d MMMM yyyy", { locale: ru });
}

export function ProjectsGrid({ projects, className }: ProjectsGridProps) {
  return (
    <div className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-3", className)}>
      {projects.map((project) => {
        const tasksProgress =
          project.tasksTotal > 0
            ? (project.tasksDone / project.tasksTotal) * 100
            : 0;

        return (
          <Card
            key={project.id}
            className="rounded-xl border border-neutral-200/80 bg-white shadow-[0_4px_18px_rgba(34,48,62,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(34,48,62,0.14)]"
          >
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1.5">
                <div className="text-[15px] font-semibold leading-snug text-[#2f2b3d]">
                  {project.name}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#a1acb8]">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="size-3.5" />
                    Обновлён:{" "}
                    <span className="text-[#566a7f]">
                      {formatDate(project.lastUpdated)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" />
                    Ответственный:{" "}
                    <span className="text-[#566a7f]">{project.ownerName}</span>
                  </span>
                </div>
              </div>

              <SegmentProgress value={project.stagePercent} />

              <div className="flex items-center justify-between gap-2 text-xs text-[#566a7f]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {project.region}
                </span>
                <span className="tabular-nums">
                  {project.participants} участника(ов)
                </span>
              </div>

              <div className="space-y-1.5 rounded-lg bg-[#f5f5f9] px-3 py-2.5">
                <div className="flex items-center justify-between text-xs text-[#566a7f]">
                  <span>
                    Задачи: {project.tasksDone} / {project.tasksTotal}
                  </span>
                  <span className="tabular-nums font-semibold text-[#696cff]">
                    {Math.round(tasksProgress)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#e2e6f0]">
                  <div
                    className="h-full rounded-full bg-[#71dd37]"
                    style={{ width: `${tasksProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
