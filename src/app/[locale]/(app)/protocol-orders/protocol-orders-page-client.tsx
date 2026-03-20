"use client";

import { useState } from "react";

type EmployeeItem = {
  id: number;
  fio: string;
  position: string;
  department: string;
};

type ProtocolOrderItem = {
  id: number;
  employeeId: number;
  employeeName: string;
  department: string;
  title: string;
  description: string;
  deadline: string;
  status: "new" | "in_progress" | "done";
};

const MOCK_EMPLOYEES: EmployeeItem[] = [
  {
    id: 1,
    fio: "Нурлан Абдрахманов",
    position: "Руководитель направления",
    department: "Управление строительства и ЖКХ",
  },
  {
    id: 2,
    fio: "Данияр Смагулов",
    position: "Старший инженер",
    department: "Отдел водоснабжения и водоотведения",
  },
  {
    id: 3,
    fio: "Айсулу Омарова",
    position: "Инспектор",
    department: "Управление государственного пожарного надзора",
  },
  {
    id: 4,
    fio: "Марат Талгатов",
    position: "Координатор",
    department: "Управление пассажирского транспорта и автомобильных дорог",
  },
  {
    id: 5,
    fio: "Светлана Касымова",
    position: "Специалист по эксплуатации",
    department: "Отдел благоустройства и озеленения",
  },
];

const INITIAL_ORDERS: ProtocolOrderItem[] = [
  {
    id: 101,
    employeeId: 2,
    employeeName: "Данияр Смагулов",
    department: "Отдел водоснабжения и водоотведения",
    title: "Подготовить отчет по модернизации водоснабжения",
    description:
      "Собрать статус по объектам, сроки завершения и проблемные участки.",
    deadline: "2026-03-25",
    status: "new",
  },
  {
    id: 102,
    employeeId: 4,
    employeeName: "Марат Талгатов",
    department: "Управление пассажирского транспорта и автомобильных дорог",
    title: "Актуализировать план по дорожной безопасности",
    description:
      "Подготовить предложения по корректировке плана мероприятий на квартал.",
    deadline: "2026-03-28",
    status: "in_progress",
  },
];

function getStatusLabel(status: ProtocolOrderItem["status"]) {
  switch (status) {
    case "new":
      return "Новое";
    case "in_progress":
      return "В работе";
    case "done":
      return "Исполнено";
    default:
      return status;
  }
}

function getStatusClasses(status: ProtocolOrderItem["status"]) {
  switch (status) {
    case "new":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "in_progress":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "done":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    default:
      return "bg-neutral-50 text-neutral-700 ring-neutral-600/20";
  }
}

export function ProtocolOrdersPageClient() {
  const [items, setItems] = useState<ProtocolOrderItem[]>(INITIAL_ORDERS);
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleCreateOrder = () => {
    const selectedEmployee = MOCK_EMPLOYEES.find(
      (employee) => employee.id === Number(employeeId),
    );

    if (!selectedEmployee || !title.trim() || !deadline) {
      return;
    }

    const newOrder: ProtocolOrderItem = {
      id: Date.now(),
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.fio,
      department: selectedEmployee.department,
      title: title.trim(),
      description: description.trim(),
      deadline,
      status: "new",
    };

    setItems((prev) => [newOrder, ...prev]);
    setEmployeeId("");
    setTitle("");
    setDescription("");
    setDeadline("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Протокольные поручения
        </h1>
        <div className="mt-1 text-sm text-neutral-500">
          Назначение поручений сотрудникам и контроль исполнения.
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-neutral-900">
            Выдать поручение
          </h2>
          <div className="mt-1 text-sm text-neutral-500">
            Выберите сотрудника и заполните данные поручения.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">
              Сотрудник
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-neutral-400"
            >
              <option value="">Выберите сотрудника</option>
              {MOCK_EMPLOYEES.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fio} — {employee.position}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">Срок</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-neutral-400"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-neutral-700">
              Заголовок поручения
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите краткое название поручения"
              className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-sm outline-none transition focus:border-neutral-400"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-neutral-700">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Опишите детали поручения"
              rows={4}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleCreateOrder}
            className="inline-flex h-10 items-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Выдать поручение
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">
                  Сотрудник
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">
                  Подразделение
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">
                  Поручение
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">
                  Срок
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">
                  Статус
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100 bg-white">
              {items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3 text-neutral-900">
                    <div className="font-medium">{item.employeeName}</div>
                  </td>

                  <td className="px-4 py-3 text-neutral-600">
                    {item.department}
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900">
                      {item.title}
                    </div>
                    <div className="mt-1 text-neutral-500">
                      {item.description}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-neutral-600">{item.deadline}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(
                        item.status,
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}