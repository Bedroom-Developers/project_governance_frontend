import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Direction } from "@/modules/directions/schemas/direction.schema";

import { DirectionsGrid } from "../directions-grid";

describe("DirectionsGrid — карточки направлений", () => {
  const directions: Direction[] = [
    {
      id: "1",
      name: "Карьерный центр города Семей",
      ownerName: "Марат С.",
      projectGroupsCount: 38,
      projectsCount: 10310,
    },
    {
      id: "2",
      name: "Карьерный центр Аягозского района",
      ownerName: "Айдана Т.",
      projectGroupsCount: 0,
      projectsCount: 0,
    },
  ];

  it("отображает карточки направлений с названием и ответственным", () => {
    render(<DirectionsGrid directions={directions} />);

    expect(screen.getByText(directions[0].name)).toBeInTheDocument();
    expect(screen.getByText(directions[1].name)).toBeInTheDocument();
    expect(screen.getByText(directions[0].ownerName)).toBeInTheDocument();
    expect(screen.getByText(directions[1].ownerName)).toBeInTheDocument();
  });

  it("отображает значения количества групп проектов и проектов", () => {
    render(<DirectionsGrid directions={directions} />);

    expect(screen.getByText("38")).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.replaceAll(/\s/g, "") === "10310"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });
});
