"use client";

import type { Direction } from "@/modules/directions";
import type { ProjectGroup } from "@/modules/directions/schemas/project-group.schema";
import type { Project } from "@/modules/directions/schemas/project.schema";

export const DIRECTIONS_STORAGE_KEY = "directions-items";
export const GROUPS_STORAGE_KEY = "direction-groups";
export const PROJECTS_STORAGE_KEY = "group-projects";

export type GroupsByDirection = Record<string, ProjectGroup[]>;
export type ProjectsByGroupKey = Record<string, Project[]>;

export const DEFAULT_DIRECTIONS: Direction[] = [
  {
    id: "1231",
    name: "БН2 Развитие инфраструктуры",
    ownerName: "Ербол Садыр",
    createdByName: "Берик Уали",
    passportResponsibleName: "Ербол Садыр",
    passportResponsibleTitle: "Зам. Акима Области Абай",
    passportTaskNote: "Заполнение паспорта проекта и базовой информации",
    projectGroupsCount: 1,
    projectsCount: 1,
  },
];

export const DEFAULT_GROUPS: GroupsByDirection = {
  "1231": [
    {
      id: 664,
      name: "Общая инфраструктура",
      ownerName: "Камария Кажгалиева",
      projectsCount: 1,
    },
  ],
};

export const DEFAULT_PROJECTS: ProjectsByGroupKey = {
  "1231-664": [
    {
      id: 1,
      name: "Строительство спортивного комплекса г. Аягоз (ул. Шакенова)",
      lastUpdated: "2026-02-20T09:15:00Z",
      ownerName: "Камария Кажгалиева",
      stage: "planning",
      stagePercent: 30,
      region: "г. Аягоз",
      tasksTotal: 10,
      tasksDone: 3,
      participants: 6,
    },
  ],
};

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function computeDirectionStats(
  directions: Direction[],
  groupsByDirection: GroupsByDirection,
  projectsByGroupKey: ProjectsByGroupKey,
): Direction[] {
  return directions.map((direction) => {
    const groups = groupsByDirection[direction.id] ?? [];
    const projectsCount = groups.reduce((sum, group) => {
      const key = `${direction.id}-${group.id}`;
      return sum + (projectsByGroupKey[key]?.length ?? 0);
    }, 0);

    return {
      ...direction,
      projectGroupsCount: groups.length,
      projectsCount,
    };
  });
}

