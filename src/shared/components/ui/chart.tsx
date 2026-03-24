"use client";

import * as React from "react";
import type { CSSProperties } from "react";
import {
  Tooltip as RechartsTooltip,
  type TooltipProps as RechartsTooltipProps,
} from "recharts";

import { cn } from "@/shared/lib/utils";

type ChartConfigValue = {
  label?: string;
  color?: string;
};

export type ChartConfig = Record<string, ChartConfigValue>;

type ChartCssVars = CSSProperties & Record<`--color-${string}`, string>;

const ChartConfigContext = React.createContext<ChartConfig | null>(null);

function useChartConfig() {
  const ctx = React.useContext(ChartConfigContext);
  if (!ctx) {
    throw new Error("Chart components must be used within ChartContainer");
  }
  return ctx;
}

function toChartCssVars(config: ChartConfig) {
  const vars: ChartCssVars = {};
  for (const [key, value] of Object.entries(config)) {
    if (value.color) {
      vars[`--color-${key}`] = value.color;
    }
  }
  return vars;
}

export function ChartContainer({
  config,
  className,
  children,
  style,
  ...props
}: React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & {
    config: ChartConfig;
  }
>) {
  const cssVars = React.useMemo(() => toChartCssVars(config), [config]);

  return (
    <ChartConfigContext.Provider value={config}>
      <div
        className={cn("chart-container w-full h-full", className)}
        style={{ ...cssVars, ...style }}
        {...props}
      >
        {children}
      </div>
    </ChartConfigContext.Provider>
  );
}

export type ChartTooltipProps = Omit<
  RechartsTooltipProps<number, string>,
  "content"
> & {
  hideLabel?: boolean;
  hideIndicator?: boolean;
};

export function ChartTooltip({
  hideLabel,
  hideIndicator,
  ...props
}: ChartTooltipProps) {
  return (
    <RechartsTooltip
      {...props}
      content={
        <ChartTooltipContent
          hideLabel={hideLabel}
          hideIndicator={hideIndicator}
        />
      }
    />
  );
}

export type ChartTooltipContentProps = {
  hideLabel?: boolean;
  hideIndicator?: boolean;
};

type TooltipInjectedProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string;
    value?: number | string;
    color?: string;
  }>;
  label?: string | number;
};

export function ChartTooltipContent({
  hideLabel,
  hideIndicator,
  active,
  payload,
  label,
}: ChartTooltipContentProps & TooltipInjectedProps) {
  const config = useChartConfig();

  if (!active || !payload?.length) return null;

  const labelText = label ? String(label) : null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      {!hideLabel && labelText ? (
        <div className="mb-2 text-xs font-semibold text-[#6b7280]">
          {labelText}
        </div>
      ) : null}

      <div className="space-y-1">
        {payload.map((entry) => {
          const key = (entry?.name ?? entry?.dataKey ?? "") as string;
          const series = config[key];
          const color = entry?.color ?? series?.color ?? "#6b7280";
          const value = entry?.value;
          const seriesLabel = series?.label ?? key;

          return (
            <div
              key={`${key}-${String(value)}`}
              className="flex items-center gap-2"
            >
              {!hideIndicator ? (
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ) : null}
              <span className="text-xs font-semibold text-[#374151]">
                {seriesLabel}:
              </span>
              <span className="text-xs font-semibold text-[#111827] tabular-nums">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
