import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { UserDetailsDialogItem } from "../../user-details-dialog/user-details-dialog";
import { UsersTable } from "../users-table";

describe("UsersTable — таблица пользователей", () => {
  const items: UserDetailsDialogItem[] = [
    {
      id: 1,
      fio: "Нурлан Абдрахманов",
      systemRole: "admin",
      organization: "Акимат",
      department: "Управление строительства",
      position: "Руководитель направления",
      specialization: "Строительство и инфраструктура",
      email: "n.abdrakhmanov@akimat.gov.kz",
      phone: "+7 (701) 123-45-67",
      projects: [
        {
          projectName: "Модернизация водоснабжения",
          projectRole: "Куратор проекта",
        },
      ],
      user: {
        id: 1,
        email: "n.abdrakhmanov@akimat.gov.kz",
        name: "Нурлан Абдрахманов",
        avatar: "",
        role: "admin",
        isActive: true,
      },
    },
    {
      id: 2,
      fio: "Данияр Смагулов",
      systemRole: "user",
      organization: "УЖКХ области Абай",
      department: "Отдел водоснабжения и водоотведения",
      position: "Старший инженер",
      specialization: "Водоснабжение и канализация (ЖКХ)",
      email: "d.smagulov@zhkh.gov.kz",
      phone: "+7 (705) 222-10-01",
      projects: [
        {
          projectName: "Модернизация водоснабжения",
          projectRole: "Исполнитель",
        },
      ],
      user: {
        id: 2,
        email: "d.smagulov@zhkh.gov.kz",
        name: "Данияр Смагулов",
        avatar: "",
        role: "user",
        isActive: true,
      },
    },
  ];

  it("отображает ФИО и триггеры модалки", () => {
    render(<UsersTable items={items} />);

    expect(screen.getByText(items[0].fio)).toBeInTheDocument();
    expect(screen.getByText(items[1].fio)).toBeInTheDocument();

    expect(screen.getAllByText("Подробнее")).toHaveLength(2);
  });
});
