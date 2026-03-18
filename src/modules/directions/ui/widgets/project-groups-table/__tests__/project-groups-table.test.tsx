import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ProjectGroup } from "@/modules/directions/schemas/project-group.schema";

import { ProjectGroupsTable } from "../project-groups-table";

describe("ProjectGroupsTable — таблица групп проектов", () => {
  const groups: ProjectGroup[] = [
    {
      id: 663,
      name: "Цифровизация",
      ownerName: "Камария Кажгалиева",
      projectsCount: 7,
    },
  ];

  it("отображает строки с данными и кнопками действий", () => {
    render(<ProjectGroupsTable groups={groups} />);

    expect(screen.getByText("663")).toBeInTheDocument();
    expect(screen.getByText("Цифровизация")).toBeInTheDocument();
    expect(screen.getByText("Камария Кажгалиева")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Проекты/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Дэшборд")).toBeInTheDocument();
  });
});
