"use client";

import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  Flag,
  FolderTree,
  ListChecks,
  Mail,
  MessageSquareText,
  Pin,
  Send,
  Sparkles,
  Video,
} from "lucide-react";
import { useLocale } from "next-intl";
import * as React from "react";
import type { Project } from "@/modules/directions/schemas/project.schema";
import {
  Button,
  Card,
  CardContent,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/shared/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { SegmentProgress } from "@/shared/components/ui/segment-progress";
import { Link } from "@/shared/configs/i18/navigation";
import { cn } from "@/shared/lib/utils";

type ProjectsGridProps = {
  projects: Project[];
  directionId: string;
  groupId: string;
  className?: string;
};

export function ProjectsGrid({
  projects,
  directionId,
  groupId,
  className,
}: ProjectsGridProps) {
  const locale = useLocale();
  const formatNumber = (value: number) =>
    new Intl.NumberFormat(locale).format(value);
  const formatDateTime = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  const getInitials = (value: string) =>
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

  const projectPathItems = [
    "БН5 Типовое базовое направление",
    "Повышение правопорядка",
  ];

  return (
    <div className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {projects.map((project) => (
        <Dialog key={project.id}>
          <DialogTrigger className="text-left">
            <Card
              className={cn(
                "h-full rounded-xl border border-neutral-200/80 bg-white shadow-[0_4px_18px_rgba(34,48,62,0.08)]",
                "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(34,48,62,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#696cff]/40",
              )}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <div className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#2f2b3d]">
                      {project.name}
                    </div>
                    <div className="text-xs text-[#a1acb8]">
                      Ответственный:{" "}
                      <span className="font-semibold text-[#566a7f]">
                        {project.ownerName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                      Стадия проекта
                    </div>
                    <SegmentProgress
                      value={project.stagePercent}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-neutral-200/70 bg-white px-3 pb-2.5 pt-2 shadow-[0_1px_0_rgba(34,48,62,0.04)]">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                        Регион
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-[#2f2b3d]">
                        {project.region}
                      </div>
                    </div>
                    <div className="rounded-lg border border-neutral-200/70 bg-white px-3 pb-2.5 pt-2 shadow-[0_1px_0_rgba(34,48,62,0.04)]">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                        Задачи
                      </div>
                      <div className="mt-0.5 text-sm font-semibold text-[#2f2b3d]">
                        {formatNumber(project.tasksDone)} из{" "}
                        {formatNumber(project.tasksTotal)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#a1acb8]">
                    <div>
                      Участники:{" "}
                      <span className="font-semibold text-[#566a7f]">
                        {formatNumber(project.participants)}
                      </span>
                    </div>
                    <div>
                      Обновлён:{" "}
                      <span className="font-semibold text-[#566a7f]">
                        {formatDateTime(project.lastUpdated)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>

          <DialogContent className="max-w-6xl space-y-6">
            <DialogHeader className="space-y-4 rounded-2xl border border-neutral-200/70 bg-white px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <DialogTitle className="text-xl font-semibold leading-snug text-[#1f2933]">
                    {project.name}
                  </DialogTitle>
                  <p className="text-sm text-[#6b7280]">
                    Проект в регионе{" "}
                    <span className="font-medium text-[#374151]">
                      {project.region}
                    </span>
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/directions/${directionId}/groups/${groupId}/projects/${project.id}/milestones`}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#566a7f] shadow-[0_1px_0_rgba(34,48,62,0.04)] hover:bg-neutral-50 hover:text-[#6b7280] transition-colors"
                    >
                      <Flag className="size-4 text-[#696cff]" />
                      Вехи проекта
                      <ArrowRight className="size-4 text-[#9ca3af]" />
                    </Link>

                    <Dialog>
                      <DialogTrigger className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#566a7f] shadow-[0_1px_0_rgba(34,48,62,0.04)] hover:bg-neutral-50 hover:text-[#6b7280] transition-colors">
                        <Video className="size-4 text-[#696cff]" />
                        Камеры
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl">
                        <DialogHeader className="space-y-2">
                          <DialogTitle className="text-xl font-semibold">
                            Камеры проекта
                          </DialogTitle>
                          <p className="text-sm text-[#6b7280]">
                            Мониторинг хода стройки в реальном времени (пока
                            мок)
                          </p>
                        </DialogHeader>

                        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
                          <div className="space-y-3">
                            {["Камера 1", "Камера 2", "Камера 3"].map(
                              (camera) => (
                                <div
                                  key={camera}
                                  className="rounded-xl border border-neutral-200/70 bg-white px-4 py-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-[#111827]">
                                      {camera}
                                    </p>
                                    <span className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-semibold text-[#9ca3af]">
                                      Камера не подключена
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-[#9ca3af]">
                                    Как только появится доступ к потоку, здесь
                                    начнётся realtime-мониторинг.
                                  </p>
                                </div>
                              ),
                            )}
                          </div>

                          <div className="rounded-xl border border-neutral-200/70 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-[#111827]">
                                Моковый просмотр
                              </p>
                              <span className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-semibold text-[#9ca3af]">
                                В ожидании подключения
                              </span>
                            </div>

                            <div className="mt-4 aspect-video rounded-lg bg-neutral-50 flex items-center justify-center p-4 text-center text-sm font-semibold text-[#9ca3af]">
                              Камера не подключена
                            </div>

                            <p className="mt-3 text-xs text-[#9ca3af]">
                              После подключения вместо этого блока будет
                              отображаться видео и обновления по ходу стройки в
                              реальном времени.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2">
                  <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#696cff]">
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="size-3" />
                      Стадия проекта
                    </span>
                  </span>
                  <SegmentProgress
                    value={project.stagePercent}
                    className="w-40"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#9ca3af]">
                <span className="inline-flex items-center gap-2">
                  <Pin className="size-3 text-[#9ca3af]" />
                  Ответственный:{" "}
                  <span className="font-medium text-[#4b5563]">
                    {project.ownerName}
                  </span>
                </span>
                <span className="hidden h-3 w-px bg-neutral-200 sm:inline-block" />
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="size-3 text-[#9ca3af]" />
                  Участники:{" "}
                  <span className="font-medium text-[#4b5563]">
                    {formatNumber(project.participants)}
                  </span>
                </span>
                <span className="hidden h-3 w-px bg-neutral-200 sm:inline-block" />
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-3 text-[#9ca3af]" />
                  Обновлён:{" "}
                  <span className="font-medium text-[#4b5563]">
                    {formatDateTime(project.lastUpdated)}
                  </span>
                </span>
              </div>
            </DialogHeader>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
              <div className="space-y-5">
                <section className="rounded-xl border border-neutral-200/70 bg-white">
                  <div className="px-5 pt-4">
                    <div className="flex items-center gap-2">
                      <FolderTree className="size-4 text-[#696cff]" />
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                        ЖОБА / ПРОЕКТ
                      </p>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Pin className="size-3.5 text-[#a1acb8]" />
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                            Путь проекта
                          </p>
                        </div>
                        <nav aria-label="Хлебные крошки">
                          <ol className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                            {projectPathItems.map((item, idx) => {
                              const isFirst = idx === 0;
                              const isLast =
                                idx === projectPathItems.length - 1;

                              return (
                                <li
                                  key={item}
                                  className="inline-flex items-center gap-2"
                                >
                                  <span
                                    className={
                                      isFirst
                                        ? "text-xs font-semibold text-[#2563eb]"
                                        : "text-xs font-semibold text-[#6b7280]"
                                    }
                                  >
                                    {item}
                                  </span>
                                  {!isLast && (
                                    <ChevronRight className="size-3.5 text-[#9ca3af]" />
                                  )}
                                </li>
                              );
                            })}
                          </ol>
                        </nav>
                      </div>

                      <Separator className="bg-neutral-100" />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <ListChecks className="size-3.5 text-[#a1acb8]" />
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                              Задачи и группа проекта
                            </p>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#eef6ff] px-3 py-1 text-[12px] font-semibold text-[#2563eb]">
                              Задачи
                            </span>
                            <span className="text-[12px] text-[#6b7280]">
                              {formatNumber(project.tasksDone)} /{" "}
                              {formatNumber(project.tasksTotal)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                            Название
                          </p>
                          <p className="mt-1 text-sm font-semibold text-[#111827]">
                            {project.name}
                          </p>
                        </div>
                      </div>

                      <Separator className="bg-neutral-100" />

                      <dl className="grid gap-3 pb-4 text-sm text-[#374151] sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                            Регион
                          </dt>
                          <dd className="mt-1 font-medium text-[#111827]">
                            {project.region}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                            Ответственный
                          </dt>
                          <dd className="mt-1 font-medium text-[#111827]">
                            {project.ownerName}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                            Участники
                          </dt>
                          <dd className="mt-1 font-medium text-[#111827]">
                            {formatNumber(project.participants)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a1acb8]">
                            Обновлён
                          </dt>
                          <dd className="mt-1 font-medium text-[#111827]">
                            {formatDateTime(project.lastUpdated)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-neutral-200/70 bg-white">
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <MessageSquareText className="size-3.5 text-[#696cff]" />
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                        Краткое описание проекта
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#4b5563]">
                      Цель, ожидаемые результаты и ключевые шаги проекта в одном
                      месте. Текст можно заменить данными из бекенда.
                    </p>
                  </div>
                </section>

                <section className="rounded-xl border border-neutral-200/70 bg-white">
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Pin className="size-3.5 text-[#a1acb8]" />
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                        ЖОБА БЮДЖЕТІ / БЮДЖЕТ ПРОЕКТА
                      </p>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm text-[#4b5563]">
                      <div className="flex items-start justify-between gap-4">
                        <span className="inline-flex items-center gap-2 text-[#9ca3af]">
                          <Pin className="size-3 text-[#9ca3af]" />
                          Потребность в бюджете
                        </span>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Не требуется
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[#9ca3af]">
                          Стоимость проекта (ТЭО)
                        </span>
                        <span className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-semibold text-[#6b7280]">
                          Не заполнено
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[#9ca3af]">
                          Стоимость проекта (ПСД)
                        </span>
                        <span className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-semibold text-[#6b7280]">
                          Не заполнено
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[#9ca3af]">
                          Информация по бюджету
                        </span>
                        <span className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-semibold text-[#6b7280]">
                          Не заполнено
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="rounded-xl border border-neutral-200/70 bg-white">
                  <div className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-[#696cff]" />
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                        ҚАТЫСУШЫЛАР / УЧАСТНИКИ
                      </p>
                    </div>
                    <div className="mt-4 space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-[#9ca3af]">
                          Руководитель проекта
                        </p>
                        <div className="mt-2 rounded-xl border border-neutral-200/70 bg-white p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 text-sm font-semibold text-[#4b5563]">
                              {getInitials(project.ownerName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-[#2563eb]">
                                {project.ownerName}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-[#9ca3af]">
                                Руководитель проекта (пример)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#9ca3af]">
                          Администратор проекта
                        </p>
                        <div className="mt-2 rounded-xl border border-neutral-200/70 bg-white p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 text-sm font-semibold text-[#4b5563]">
                              {getInitials(project.ownerName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-[#2563eb]">
                                {project.ownerName}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-[#9ca3af]">
                                Администратор проекта (пример)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-[#9ca3af]">
                            Куратор проекта
                          </p>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-[#9ca3af] hover:bg-neutral-50 hover:text-[#6b7280]"
                          >
                            <Pin className="size-3 text-[#9ca3af]" />
                            изменить
                          </button>
                        </div>
                        <div className="mt-2 rounded-xl border border-neutral-200/70 bg-white p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 text-sm font-semibold text-[#4b5563]">
                              {getInitials(project.ownerName)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-[#2563eb]">
                                {project.ownerName}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-[#9ca3af]">
                                Куратор проекта (пример)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#9ca3af]">
                          Наблюдатели
                        </p>
                        <div className="mt-2 space-y-3">
                          {[
                            { name: "Жулдыз Сулейменова", role: "Министр" },
                            { name: "Едил Оспан", role: "Вице-министр" },
                            {
                              name: "Камария Кажигалиева",
                              role: "Руководитель ПО обл Абай",
                            },
                          ].map((person) => (
                            <div
                              key={person.name}
                              className="rounded-xl border border-neutral-200/70 bg-white p-4"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-50 text-sm font-semibold text-[#4b5563]">
                                  {getInitials(person.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-[14px] font-semibold text-[#2563eb]">
                                    {person.name}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs text-[#9ca3af]">
                                    {person.role}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="rounded-xl border border-neutral-200/70 bg-white">
                <Tabs defaultValue="comments" className="gap-0">
                  <div className="border-b border-neutral-100 px-4 py-3">
                    <TabsList className="h-9 w-full justify-start rounded-lg bg-neutral-50">
                      <TabsTrigger
                        value="comments"
                        className="flex-none px-3 flex items-center gap-2"
                      >
                        <MessageSquareText className="size-4 text-[#696cff]" />
                        Комментарий
                      </TabsTrigger>
                      <TabsTrigger
                        value="case"
                        className="flex-none px-3 flex items-center gap-2"
                      >
                        <FolderTree className="size-4 text-[#696cff]" />
                        Дело
                      </TabsTrigger>
                      <TabsTrigger
                        value="task"
                        className="flex-none px-3 flex items-center gap-2"
                      >
                        <ListChecks className="size-4 text-[#2563eb]" />
                        Задача
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="px-4 py-4">
                    <TabsContent value="comments">
                      <div className="rounded-xl border border-neutral-200/70 bg-white p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <MessageSquareText className="size-4 text-[#696cff]" />
                            <p className="text-sm font-semibold text-[#111827]">
                              Добавить комментарий в историю
                            </p>
                          </div>
                          <p className="text-xs text-[#9ca3af]">
                            Дата изменения проставляется автоматически
                          </p>
                        </div>
                        <Textarea
                          placeholder="Напишите комментарий или описание действия…"
                          className="min-h-24 resize-none border-0 text-sm focus-visible:ring-0"
                        />
                        <div className="mt-4 border-t border-neutral-100 pt-3">
                          <p className="text-xs text-[#9ca3af]">
                            Подсказка: укажите, что сделано и кем
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="case">
                      <div className="rounded-xl border border-neutral-200/70 bg-white p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <FolderTree className="size-4 text-[#696cff]" />
                            <p className="text-sm font-semibold text-[#111827]">
                              Добавить событие по делу
                            </p>
                          </div>
                          <p className="text-xs text-[#9ca3af]">
                            Дата изменения проставляется автоматически
                          </p>
                        </div>
                        <Textarea
                          placeholder="Опишите изменения по делу проекта…"
                          className="min-h-24 resize-none border-0 text-sm focus-visible:ring-0"
                        />
                        <div className="mt-4 border-t border-neutral-100 pt-3">
                          <p className="text-xs text-[#9ca3af]">
                            Подсказка: укажите этап/статус и кем
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="task">
                      <div className="rounded-xl border border-neutral-200/70 bg-white p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <ListChecks className="size-4 text-[#2563eb]" />
                            <p className="text-sm font-semibold text-[#111827]">
                              Добавить событие по задаче
                            </p>
                          </div>
                          <p className="text-xs text-[#9ca3af]">
                            Дата изменения проставляется автоматически
                          </p>
                        </div>
                        <Textarea
                          placeholder="Опишите результат или текущий статус задачи…"
                          className="min-h-24 resize-none border-0 text-sm focus-visible:ring-0"
                        />
                        <div className="mt-4 border-t border-neutral-100 pt-3">
                          <p className="text-xs text-[#9ca3af]">
                            Подсказка: укажите результат и исполнителя
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </div>

                  <div className="px-4 pt-2">
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-neutral-200/70 bg-white px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Video className="size-4 text-[#696cff]" />
                        <p className="text-sm font-semibold text-[#111827]">
                          Действия
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Pin className="size-4" />
                          Закрепить событие
                        </Button>
                        <Button size="sm">
                          <Send className="size-4" />
                          Отправить в историю
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4">
                    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-neutral-200/70 bg-white px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-[#696cff]" />
                        <p className="text-sm font-semibold text-[#111827]">
                          История действий
                        </p>
                      </div>
                      <div className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-semibold text-[#4b5563]">
                        5 событий
                      </div>
                    </div>
                    {(() => {
                      const baseTime = new Date(project.lastUpdated).getTime();
                      const dayMs = 24 * 60 * 60 * 1000;
                      const makeIso = (daysAgo: number) =>
                        new Date(baseTime - daysAgo * dayMs).toISOString();

                      const historyItems = [
                        {
                          id: "comment",
                          badge: {
                            text: "выполнено",
                            className: "bg-emerald-50 text-emerald-700",
                          },
                          title: "Комментарий",
                          icon: (
                            <MessageSquareText className="size-4 text-[#696cff]" />
                          ),
                          body: (
                            <>
                              <p className="mt-1 text-sm text-[#4b5563]">
                                Бизнес-процесс «Утвердить переход на стадию…»
                                утвержден.
                              </p>
                              <p className="mt-1 text-xs text-[#9ca3af]">
                                Кем: {project.ownerName}
                              </p>
                            </>
                          ),
                          updatedIso: makeIso(0),
                        },
                        {
                          id: "task",
                          badge: {
                            text: "выполнено",
                            className: "bg-emerald-50 text-emerald-700",
                          },
                          title: "Задание бизнес-процесса",
                          icon: (
                            <ListChecks className="size-4 text-[#2563eb]" />
                          ),
                          body: (
                            <dl className="mt-2 grid gap-2 text-sm text-[#4b5563]">
                              <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
                                <dt className="text-[#9ca3af]">Процесс</dt>
                                <dd className="font-medium text-[#111827]">
                                  Утвердить переход на стадию
                                </dd>
                              </div>
                              <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
                                <dt className="text-[#9ca3af]">Исполнитель</dt>
                                <dd className="font-medium text-[#111827]">
                                  {project.ownerName}
                                </dd>
                              </div>
                            </dl>
                          ),
                          updatedIso: makeIso(2),
                        },
                        {
                          id: "case",
                          badge: {
                            text: "в процессе",
                            className: "bg-[#eef1ff] text-[#696cff]",
                          },
                          title: "Дело проекта",
                          icon: (
                            <FolderTree className="size-4 text-[#696cff]" />
                          ),
                          body: (
                            <>
                              <p className="mt-1 text-sm text-[#4b5563]">
                                Дело сформировано и передано на следующую
                                стадию.
                              </p>
                            </>
                          ),
                          updatedIso: makeIso(4),
                        },
                        {
                          id: "mail",
                          badge: {
                            text: "отправлено",
                            className: "bg-[#fef3c7] text-[#b45309]",
                          },
                          title: "Письмо",
                          icon: <Mail className="size-4 text-[#b45309]" />,
                          body: (
                            <>
                              <p className="mt-1 text-sm text-[#4b5563]">
                                Документы направлены ответственному исполнителю.
                              </p>
                            </>
                          ),
                          updatedIso: makeIso(6),
                        },
                        {
                          id: "status",
                          badge: {
                            text: "обновлено",
                            className: "bg-neutral-50 text-[#4b5563]",
                          },
                          title: "Изменение статуса",
                          icon: <Sparkles className="size-4 text-[#696cff]" />,
                          body: (
                            <>
                              <p className="mt-1 text-sm text-[#4b5563]">
                                Статус процесса обновлен согласно регламенту.
                              </p>
                              <p className="mt-1 text-xs text-[#9ca3af]">
                                Кем: {project.ownerName}
                              </p>
                            </>
                          ),
                          updatedIso: makeIso(8),
                        },
                      ];

                      return (
                        <div className="relative rounded-xl border border-neutral-200/70 bg-white p-3">
                          <div className="relative grid grid-cols-[40px_1fr] gap-x-4 gap-y-3">
                            <div
                              aria-hidden="true"
                              className="absolute left-[19px] top-1 bottom-1 w-[2px] bg-neutral-200"
                            />

                            {historyItems.map((item, idx) => (
                              <React.Fragment key={item.id}>
                                <div className="col-start-1 flex items-start justify-center pt-2">
                                  <div
                                    className="relative z-10 mt-1 h-3 w-3 rounded-full border-2 border-neutral-300 bg-white"
                                    style={{
                                      boxShadow:
                                        idx === 0
                                          ? "0 0 0 4px rgba(105,108,255,0.10)"
                                          : undefined,
                                    }}
                                  />
                                </div>

                                <div className="col-start-2 z-10 rounded-xl border border-neutral-200/70 bg-white p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        {item.icon}
                                        <p className="text-sm font-semibold text-[#111827]">
                                          {item.title}
                                        </p>
                                      </div>

                                      {item.body}

                                      <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-neutral-100 bg-neutral-50 px-3 py-1 text-xs font-semibold text-[#9ca3af]">
                                        <CalendarDays className="size-3.5" />
                                        {formatDateTime(item.updatedIso)}
                                      </div>
                                    </div>

                                    <span
                                      className={`flex-none whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        item.badge.className
                                      }`}
                                    >
                                      {item.badge.text}
                                    </span>
                                  </div>
                                </div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </Tabs>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
