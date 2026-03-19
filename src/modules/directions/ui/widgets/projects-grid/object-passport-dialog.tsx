"use client";

import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  UserRound,
  Users,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

type PassportStepStatus = "completed" | "in-progress" | "not-started";

type PassportPerson = {
  fio: string;
  position: string;
  department: string;
};

type PassportFile = {
  name: string;
  extension: string;
};

type PassportSubstep = {
  title: string;
  people: PassportPerson[];
  files: PassportFile[];
};

type PassportStep = {
  title: string;
  people: PassportPerson[];
  files: PassportFile[];
  status: PassportStepStatus;
  substeps?: PassportSubstep[];
};

function getInitials(fio: string) {
  return fio
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getStepStatusMeta(status: PassportStepStatus) {
  if (status === "completed") {
    return {
      label: "завершен",
      pillClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
      borderLClassName: "border-l-emerald-200",
      icon: <CheckCircle2 className="size-4" />,
    };
  }

  if (status === "in-progress") {
    return {
      label: "в работе",
      pillClassName:
        "border-[#696cff]/40 bg-[#eef1ff] text-[#696cff] dark:border-[#696cff]/30 dark:bg-[#eef1ff]/40 dark:text-[#c7c4ff]",
      borderLClassName: "border-l-[#696cff]/40",
      icon: <Clock3 className="size-4" />,
    };
  }

  return {
    label: "не начат",
    pillClassName:
      "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950/30 dark:text-neutral-300",
    borderLClassName: "border-l-neutral-200",
    icon: <CircleDashed className="size-4" />,
  };
}

function normalizeExtension(extension: string) {
  return extension.trim().replace(/^\./, "").toLowerCase();
}

function getFileMeta(extension: string) {
  const ext = normalizeExtension(extension);

  if (ext === "pdf") {
    return {
      icon: <FileText className="size-4" />,
      rowClassName:
        "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200",
      iconClassName: "text-rose-600 dark:text-rose-200",
    };
  }

  if (ext === "doc" || ext === "docx") {
    return {
      icon: <FileText className="size-4" />,
      rowClassName:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200",
      iconClassName: "text-blue-600 dark:text-blue-200",
    };
  }

  if (ext === "xls" || ext === "xlsx") {
    return {
      icon: <FileSpreadsheet className="size-4" />,
      rowClassName:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
      iconClassName: "text-emerald-600 dark:text-emerald-200",
    };
  }

  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp") {
    return {
      icon: <FileImage className="size-4" />,
      rowClassName:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-200",
      iconClassName: "text-violet-600 dark:text-violet-200",
    };
  }

  if (ext === "zip" || ext === "rar" || ext === "7z") {
    return {
      icon: <FileArchive className="size-4" />,
      rowClassName:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200",
      iconClassName: "text-amber-600 dark:text-amber-200",
    };
  }

  return {
    icon: <FileText className="size-4" />,
    rowClassName:
      "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950/30 dark:text-neutral-300",
    iconClassName: "text-neutral-600 dark:text-neutral-300",
  };
}

const PASSPORT_STEPS: PassportStep[] = [
  {
    title: "Рассмотрение - заявка (протокол/постановление)",
    people: [
      {
        fio: "Ерлан Нурланов",
        position: "Руководитель направления",
        department: "РКС",
      },
    ],
    files: [{ name: "Протокол_РКС.pdf", extension: "pdf" }],
    status: "completed",
  },
  {
    title: "Согласование - Земельный участок",
    people: [
      {
        fio: "Камария Кажигалиева",
        position: "Главный архитектор",
        department: "Архитектура",
      },
      {
        fio: "Бауржан Шакабасов",
        position: "Специалист по участкам",
        department: "Земельный отдел",
      },
      {
        fio: "Асхат Сатыбалдин",
        position: "Согласование",
        department: "Монополисты",
      },
    ],
    files: [],
    status: "completed",
    substeps: [
      {
        title: "Согласование - Архитектура",
        people: [
          {
            fio: "Камария Кажигалиева",
            position: "Главный архитектор",
            department: "Архитектура",
          },
        ],
        files: [
          {
            name: "Схема_согласования_архитектура.pdf",
            extension: "pdf",
          },
        ],
      },
      {
        title: "Согласование - Земельный участок",
        people: [
          {
            fio: "Бауржан Шакабасов",
            position: "Специалист по участкам",
            department: "Земельный отдел",
          },
        ],
        files: [{ name: "Схема_отвода_земельный_отдел.pdf", extension: "pdf" }],
      },
      {
        title: "Согласование - Монополисты",
        people: [
          {
            fio: "Асхат Сатыбалдин",
            position: "Техническое согласование",
            department: "Монополисты",
          },
        ],
        files: [{ name: "Тех_условия_монополисты.pdf", extension: "pdf" }],
      },
      {
        title: "Возврат - доработка - Архитектура",
        people: [
          {
            fio: "Камария Кажигалиева",
            position: "Главный архитектор",
            department: "Архитектура",
          },
        ],
        files: [],
      },
      {
        title: "Схема отвода - Земельный участок",
        people: [
          {
            fio: "Камария Кажигалиева",
            position: "Главный архитектор",
            department: "Архитектура",
          },
          {
            fio: "Бауржан Шакабасов",
            position: "Специалист по участкам",
            department: "Земельный отдел",
          },
        ],
        files: [{ name: "Схема_отвода_финальная.png", extension: "png" }],
      },
    ],
  },
  {
    title: "Оформление прав - Земельный участок",
    people: [
      {
        fio: "Бауржан Шакабасов",
        position: "Специалист по правам",
        department: "Земельный отдел",
      },
      {
        fio: "Ерлан Нурланов",
        position: "Юрист",
        department: "НАО",
      },
      {
        fio: "Асхат Сатыбалдин",
        position: "Согласующий",
        department: "Акимат",
      },
    ],
    files: [
      { name: "Постановление_акимата.pdf", extension: "pdf" },
      { name: "Согласование_НАО.docx", extension: "docx" },
    ],
    status: "completed",
  },
  {
    title: "Подписание - договор аренды",
    people: [
      {
        fio: "Бауржан Шакабасов",
        position: "Ведущий специалист",
        department: "Земельный отдел",
      },
      {
        fio: "Камария Кажигалиева",
        position: "Инициатор",
        department: "Инициатор",
      },
    ],
    files: [
      { name: "Договор_аренды.pdf", extension: "pdf" },
      { name: "Приложение_к_договору.xlsx", extension: "xlsx" },
    ],
    status: "completed",
  },
  {
    title: "Государственная регистрация - Земельный участок",
    people: [
      {
        fio: "Асхат Сатыбалдин",
        position: "Регистратор",
        department: "Гипрозем",
      },
      {
        fio: "Ерлан Нурланов",
        position: "Оператор ЦОН",
        department: "ЦОН",
      },
    ],
    files: [
      { name: "Кадастровый_паспорт.pdf", extension: "pdf" },
      { name: "Границы_участка.png", extension: "png" },
    ],
    status: "completed",
  },
  {
    title: "Получение - АПЗ (архитектурно-планировочное задание)",
    people: [
      {
        fio: "Камария Кажигалиева",
        position: "Выдача АПЗ",
        department: "Архитектура",
      },
      {
        fio: "Асхат Сатыбалдин",
        position: "Технические согласования",
        department: "Монополисты",
      },
    ],
    files: [{ name: "АПЗ_условия.pdf", extension: "pdf" }],
    status: "completed",
  },
  {
    title: "Согласование - эскизный проект",
    people: [
      {
        fio: "Камария Кажигалиева",
        position: "Архитектор проекта",
        department: "Архитектура",
      },
    ],
    files: [
      { name: "Эскизный_проект.pdf", extension: "pdf" },
      { name: "Пояснительная_записка.docx", extension: "docx" },
    ],
    status: "completed",
  },
  {
    title: "Экспертиза - проектная документация",
    people: [
      {
        fio: "Ерлан Нурланов",
        position: "Эксперт",
        department: "Экспертная организация (через epsd)",
      },
    ],
    files: [
      { name: "Заключение_экспертизы.pdf", extension: "pdf" },
      { name: "Отчет_epsd.xlsx", extension: "xlsx" },
    ],
    status: "completed",
  },
  {
    title: "Уведомление - начало строительства (талон)",
    people: [
      {
        fio: "Асхат Сатыбалдин",
        position: "Е-лиценз",
        department: "Е-лиценз",
      },
    ],
    files: [{ name: "Талон_уведомления.pdf", extension: "pdf" }],
    status: "completed",
  },
];

function PeopleList({ people }: { people: PassportPerson[] }) {
  return (
    <div className="space-y-1.5">
      {people.map((person) => (
        <div
          key={person.fio}
          className="flex items-start gap-2 rounded-lg border border-neutral-200/70 bg-white p-2 transition-colors hover:bg-neutral-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-50 text-sm font-semibold text-[#4b5563]">
            {getInitials(person.fio)}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#1f2933]">
              {person.fio}
            </div>
            <div className="mt-0.5 text-xs text-[#6b7280]">
              <span className="inline-flex items-center gap-2">
                <UserRound className="size-3.5 text-[#9ca3af]" />
                <span className="font-semibold text-[#4b5563]">
                  {person.position}
                </span>
              </span>
            </div>
            <div className="mt-0.5 text-xs text-[#9ca3af]">
              {person.department}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FilesList({ files }: { files: PassportFile[] }) {
  if (!files.length) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-[#696cff]" />
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
          Прикрепленные документы
        </p>
      </div>

      <div className="mt-1 space-y-1.5">
        {files.map((file) => {
          const meta = getFileMeta(file.extension);

          return (
            <div
              key={`${file.name}-${file.extension}`}
              className="flex items-center gap-2 rounded-lg border border-neutral-200/70 bg-white px-2 py-1.5 transition-colors hover:bg-neutral-50"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md ${meta.rowClassName}`}
              >
                <span className={meta.iconClassName}>{meta.icon}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[#1f2933]">
                  {file.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubstepsList({ substeps }: { substeps: PassportSubstep[] }) {
  return (
    <div className="mt-2 rounded-xl border border-neutral-200/70 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
          Состав подэтапов
        </span>
      </div>

      <div className="mt-2 space-y-1.5 border-l-2 border-dashed border-neutral-200 pl-3">
        {substeps.map((substep) => (
          <div
            key={substep.title}
            className="rounded-xl border border-neutral-200/70 bg-white p-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1f2933]">
                  {substep.title}
                </p>
                <div className="mt-3">
                  <PeopleList people={substep.people} />
                </div>
                <FilesList files={substep.files} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectPassportStepper() {
  return (
    <ol className="space-y-3">
      {PASSPORT_STEPS.map((step) => {
        const meta = getStepStatusMeta(step.status);

        return (
          <li key={step.title}>
            <div
              className={[
                "mx-auto max-w-5xl rounded-xl border border-neutral-200/70 p-3 shadow-[0_4px_18px_rgba(34,48,62,0.06)]",
                "border-l-4 relative overflow-hidden",
                meta.borderLClassName,
              ].join(" ")}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[#1f2933]">
                    {step.title}
                  </h2>
                  <div className="mt-0.5 text-sm text-[#9ca3af]">
                    Состояние:{" "}
                    <span className="font-semibold text-[#6b7280]">
                      {meta.label}
                    </span>
                  </div>
                </div>

                <span
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                    meta.pillClassName,
                  ].join(" ")}
                >
                  {meta.icon}
                  {meta.label}
                </span>
              </div>

              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-[#696cff]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9ca3af]">
                    Ответственные лица
                  </p>
                </div>

                <div className="mt-2">
                  <PeopleList people={step.people} />
                </div>
              </div>

              <FilesList files={step.files} />

              {step.substeps ? <SubstepsList substeps={step.substeps} /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ObjectPassportDialog({ projectName }: { projectName: string }) {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#566a7f] shadow-[0_1px_0_rgba(34,48,62,0.04)] hover:bg-neutral-50 hover:text-[#6b7280] transition-colors">
        <FileText className="size-4 text-[#696cff]" />
        Паспорт объекта
      </DialogTrigger>

      <DialogContent className="max-w-7xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold">
            Паспорт объекта
          </DialogTitle>
          <p className="text-sm text-[#6b7280]">
            {projectName} — этапы до начала стройки и последующие операции
          </p>
        </DialogHeader>

        <ObjectPassportStepper />
      </DialogContent>
    </Dialog>
  );
}
