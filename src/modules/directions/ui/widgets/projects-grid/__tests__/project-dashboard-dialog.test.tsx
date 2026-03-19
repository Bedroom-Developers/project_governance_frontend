import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Project } from "@/modules/directions/schemas/project.schema";

import { ProjectDashboardDialog } from "../project-dashboard-dialog";

describe("ProjectDashboardDialog — диалог дашборда проекта", () => {
  const project: Project = {
    id: 1,
    name: "Проект Акимата",
    lastUpdated: new Date("2026-03-01T10:00:00.000Z").toISOString(),
    ownerName: "Иван П.",
    stage: "execution",
    stagePercent: 50,
    region: "Алматы",
    tasksTotal: 10,
    tasksDone: 6,
    participants: 12,
  };

  it("отображает кнопку открытия и диаграммы после клика", () => {
    render(<ProjectDashboardDialog project={project} />);

    const button = screen.getByRole("button", { name: /Дашборд/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByText("Дашборд проекта")).toBeInTheDocument();
    expect(screen.getByText(project.name)).toBeInTheDocument();
    expect(screen.getByText("Стадия: Исполнение")).toBeInTheDocument();
    expect(screen.getByText(/Прогресс:/i)).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText(/^Просрочены$/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Скоро будут просрочены \(7 дней\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Инженерные системы/i)).toBeInTheDocument();
  });
});
