import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { UserDetailsDialogItem } from "../user-details-dialog";
import { UserDetailsDialog } from "../user-details-dialog";

describe("UserDetailsDialog — модальное окно пользователя", () => {
  const mockItem: UserDetailsDialogItem = {
    id: 1,
    fio: "Нурлан Абдрахманов",
    systemRole: "admin",
    organization: "Акимат",
    department: "Управление строительства",
    position: "Руководитель направления",
    specialization: "Строительство и инфраструктура",
    email: "n.abdrakhmanov@test.local",
    phone: "+7 (701) 123-45-67",
    projects: [
      {
        projectName: "Модернизация водоснабжения",
        projectRole: "Куратор проекта",
      },
      {
        projectName: "Строительство спортивного комплекса",
        projectRole: "Руководитель рабочей группы",
      },
    ],
    user: {
      id: 1,
      email: "n.abdrakhmanov@test.local",
      name: "Нурлан Абдрахманов",
      avatar: "",
      role: "admin",
      isActive: true,
    },
  };

  it("открывает детали и показывает роли и доступы", async () => {
    render(
      <UserDetailsDialog item={mockItem} trigger={<span>Подробнее</span>} />,
    );

    fireEvent.click(screen.getByText("Подробнее"));

    expect(await screen.findByText(mockItem.fio)).toBeInTheDocument();
    expect(screen.getByText("Основная информация")).toBeInTheDocument();
    expect(screen.getByText(mockItem.organization)).toBeInTheDocument();
    expect(screen.getByText(mockItem.department)).toBeInTheDocument();

    expect(screen.getAllByText("Роль в проекте:")).toHaveLength(
      mockItem.projects.length,
    );
    expect(
      screen.getByText(mockItem.projects[0].projectRole),
    ).toBeInTheDocument();
  });
});
