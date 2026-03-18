"use client";

import { cn } from "@/shared/lib/utils";

type SegmentProgressProps = {
  value: number; // 0-100
  segments?: number;
  className?: string;
};

const STAGES = [
  "Инициализация",
  "Планирование",
  "Реализация/Мониторинг",
  "Закрытие",
  "Завершён",
] as const;

export function getStageLabel(value: number) {
  if (value < 20) return STAGES[0];
  if (value < 40) return STAGES[1];
  if (value < 60) return STAGES[2];
  if (value < 80) return STAGES[3];
  return STAGES[4];
}

export function SegmentProgress({
  value,
  segments = 5,
  className,
}: SegmentProgressProps) {
  const normalized = Math.max(0, Math.min(100, value));
  const activeSegments = Math.round((normalized / 100) * segments) || 1;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex gap-1.5">
        {Array.from({ length: segments }).map((_, index) => {
          const isActive = index < activeSegments;

          return (
            <div
              key={`${segments}-${isActive ? "active" : "inactive"}-${index}`}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors",
                isActive ? "bg-[#696cff]" : "bg-[#e2e6f0]",
              )}
            />
          );
        })}
      </div>
      <div className="text-[11px] font-medium text-[#566a7f]">
        {getStageLabel(normalized)}
      </div>
    </div>
  );
}
