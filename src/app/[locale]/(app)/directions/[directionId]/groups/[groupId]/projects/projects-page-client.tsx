"use client";

import { ChevronDown, ChevronRight, Plus, Save } from "lucide-react";
import * as React from "react";
import { useTranslations } from "next-intl";

import type { ProjectStage } from "@/modules/directions/schemas/project.schema";
import { ProjectsGrid } from "@/modules/directions/ui/widgets/projects-grid/projects-grid";
import type { WorkspaceUser } from "@/shared/lib/app-users";
import {
  canDeleteProjects,
  canManageProjects,
  DEFAULT_HIERARCHY,
  getAvailableProjectOwners,
  HIERARCHY_STORAGE_KEY,
  type HierarchyNode,
} from "@/shared/lib/app-users";
import { getClientAuthenticatedUser } from "@/shared/lib/auth";
import {
  DEFAULT_PROJECTS,
  loadFromStorage,
  PROJECTS_STORAGE_KEY,
  saveToStorage,
  type ProjectsByGroupKey,
} from "@/shared/lib/directions-storage";

export function ProjectsPageClient({
  directionId,
  groupId,
}: {
  directionId: string;
  groupId: string;
}) {
  const t = useTranslations("projectsPage");
  const storageKey = `${directionId}-${groupId}`;
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<WorkspaceUser | null>(null);
  const [projectsByGroupKey, setProjectsByGroupKey] =
    React.useState<ProjectsByGroupKey>(DEFAULT_PROJECTS);
  const [hierarchy, setHierarchy] =
    React.useState<HierarchyNode>(DEFAULT_HIERARCHY);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [projectName, setProjectName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [stage, setStage] = React.useState<ProjectStage>("planning");
  const [stagePercent, setStagePercent] = React.useState("0");
  const [tasksTotal, setTasksTotal] = React.useState("0");
  const [tasksDone, setTasksDone] = React.useState("0");
  const [participants, setParticipants] = React.useState("1");

  const people = React.useMemo(
    () =>
      currentUser ? getAvailableProjectOwners(currentUser, hierarchy) : [],
    [currentUser, hierarchy],
  );
  const canCreateProjects = currentUser
    ? canManageProjects(currentUser.role)
    : false;
  const canRemoveProjects = currentUser
    ? canDeleteProjects(currentUser.role)
    : false;
  const projects = projectsByGroupKey[storageKey] ?? [];

  React.useEffect(() => {
    setProjectsByGroupKey(loadFromStorage(PROJECTS_STORAGE_KEY, DEFAULT_PROJECTS));
    setHierarchy(loadFromStorage(HIERARCHY_STORAGE_KEY, DEFAULT_HIERARCHY));
    setCurrentUser(getClientAuthenticatedUser());
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (currentUser?.role === "department_head") {
      setOwnerName(currentUser.name);
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (!isHydrated) return;
    saveToStorage(PROJECTS_STORAGE_KEY, projectsByGroupKey);
  }, [projectsByGroupKey, isHydrated]);

  const handleCreateProject = () => {
    if (!canCreateProjects) return;
    if (!projectName.trim() || !ownerName.trim() || !region.trim()) return;

    const nextId = Math.max(0, ...projects.map((project) => Number(project.id) || 0)) + 1;
    setProjectsByGroupKey((prev) => ({
      ...prev,
      [storageKey]: [
        {
          id: nextId,
          name: projectName.trim(),
          lastUpdated: new Date().toISOString(),
          ownerName: ownerName.trim(),
          stage,
          stagePercent: Number(stagePercent) || 0,
          region: region.trim(),
          tasksTotal: Number(tasksTotal) || 0,
          tasksDone: Number(tasksDone) || 0,
          participants: Number(participants) || 1,
        },
        ...(prev[storageKey] ?? []),
      ],
    }));

    setProjectName("");
    setOwnerName(currentUser?.role === "department_head" ? currentUser.name : "");
    setRegion("");
    setStage("planning");
    setStagePercent("0");
    setTasksTotal("0");
    setTasksDone("0");
    setParticipants("1");
    setIsCreateOpen(false);
  };

  const handleDeleteProject = React.useCallback(
    (projectId: number) => {
      if (!canRemoveProjects) return;

      const projectToDelete = projects.find((item) => item.id === projectId);
      if (!projectToDelete) return;

      const isConfirmed = window.confirm(
        `Удалить проект "${projectToDelete.name}"?`,
      );
      if (!isConfirmed) return;

      setProjectsByGroupKey((prev) => ({
        ...prev,
        [storageKey]: (prev[storageKey] ?? []).filter((item) => item.id !== projectId),
      }));
    },
    [canRemoveProjects, projects, storageKey],
  );

  if (!isHydrated) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {t("title")}
        </h1>
        <div className="rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,175,255,0.08)]">
          <div className="h-10 animate-pulse rounded-xl bg-[#eef8ff]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {t("title")}
        </h1>
        {canCreateProjects ? (
          <button
            type="button"
            onClick={() => setIsCreateOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#00BFFF]/20 bg-white px-4 py-2 text-sm font-medium text-[#0099cc] transition hover:bg-[#eef8ff]"
          >
            {isCreateOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            {t("toggleCreate")}
          </button>
        ) : null}
      </div>

      {isCreateOpen && canCreateProjects ? (
        <div className="rounded-2xl bg-white p-5 shadow-[0_2px_16px_rgba(0,175,255,0.08)]">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="size-4 text-[#00BFFF]" />
            <h2 className="text-base font-semibold text-[#0a0a0f]">
              {t("createTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-[#2f2b3d]">{t("fields.name")}</label>
              <input
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={t("placeholders.name")}
                className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2f2b3d]">{t("fields.owner")}</label>
              <select
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                disabled={currentUser?.role === "department_head"}
                className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
              >
                <option value="">{t("placeholders.owner")}</option>
                {people.map((person) => (
                  <option key={person.id} value={person.name}>
                    {person.name} — {person.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2f2b3d]">{t("fields.region")}</label>
              <input
                type="text"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                placeholder={t("placeholders.region")}
                className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2f2b3d]">{t("fields.stage")}</label>
              <select
                value={stage}
                onChange={(event) => setStage(event.target.value as ProjectStage)}
                className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
              >
                <option value="initialization">{t("stages.initialization")}</option>
                <option value="planning">{t("stages.planning")}</option>
                <option value="execution">{t("stages.execution")}</option>
                <option value="closure">{t("stages.closure")}</option>
                <option value="done">{t("stages.done")}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2f2b3d]">{t("fields.progress")}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={stagePercent}
                onChange={(event) => setStagePercent(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2f2b3d]">{t("fields.tasksTotal")}</label>
              <input
                type="number"
                min="0"
                value={tasksTotal}
                onChange={(event) => setTasksTotal(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2f2b3d]">{t("fields.tasksDone")}</label>
              <input
                type="number"
                min="0"
                value={tasksDone}
                onChange={(event) => setTasksDone(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#2f2b3d]">{t("fields.participants")}</label>
              <input
                type="number"
                min="1"
                value={participants}
                onChange={(event) => setParticipants(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#00BFFF]/20 bg-white px-3 text-sm outline-none transition focus:border-[#00BFFF]/50 focus:ring-2 focus:ring-[#00BFFF]/10"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleCreateProject}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFFF] to-[#0099cc] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,175,255,0.35)] transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_28px_rgba(0,175,255,0.5)]"
            >
              <Save className="size-4" />
              {t("save")}
            </button>
          </div>
        </div>
      ) : null}

      <ProjectsGrid
        projects={projects}
        directionId={directionId}
        groupId={groupId}
        canDelete={canRemoveProjects}
        onDelete={handleDeleteProject}
      />
    </div>
  );
}
