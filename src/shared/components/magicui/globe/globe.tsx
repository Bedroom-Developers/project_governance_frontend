"use client";

import createGlobe from "cobe";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

type GlobeProps = {
  className?: string;
  /** `login` — тёмный шар с белыми точками континентов и ореолом (как на референсе входа). */
  variant?: "default" | "login";
};

export function Globe({ className, variant = "default" }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState(520);

  const devicePixelRatio = useMemo(
    () =>
      typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio, 2),
    [],
  );

  useEffect(() => {
    if (!wrapperRef.current) return;

    const wrapper = wrapperRef.current;
    const ro = new ResizeObserver(() => {
      const next = Math.max(240, Math.min(wrapper.clientWidth, 560));
      setSize(next);
    });
    ro.observe(wrapper);
    setSize(Math.max(240, Math.min(wrapper.clientWidth, 560)));

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    let phi = 0;
    const canvas = canvasRef.current;

    const common = {
      devicePixelRatio,
      width: size * devicePixelRatio,
      height: size * devicePixelRatio,
      phi: 0,
      theta: 0.28,
      mapSamples: variant === "login" ? 26000 : 20000,
      markers: [
        { location: [50.4, 80.25] as [number, number], size: variant === "login" ? 0.085 : 0.095 },
        { location: [51.13, 71.43] as [number, number], size: variant === "login" ? 0.075 : 0.085 },
        { location: [43.24, 76.91] as [number, number], size: variant === "login" ? 0.07 : 0.08 },
      ],
      onRender: (state: { phi?: number }) => {
        state.phi = phi;
        phi += variant === "login" ? 0.0022 : 0.0018;
      },
    };

    const globe =
      variant === "login"
        ? createGlobe(canvas, {
            ...common,
            dark: 1,
            diffuse: 0.62,
            mapBrightness: 7.2,
            baseColor: [0.03, 0.032, 0.04],
            markerColor: [1, 1, 1],
            glowColor: [0.82, 0.84, 0.92],
            scale: 1.06,
          })
        : createGlobe(canvas, {
            ...common,
            dark: 0,
            diffuse: 1.25,
            mapBrightness: 6.2,
            baseColor: [0.94, 0.96, 0.99],
            markerColor: [0.12, 0.52, 0.85],
            glowColor: [0.91, 0.95, 1],
            scale: 1,
          });

    return () => globe.destroy();
  }, [devicePixelRatio, size, variant]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative aspect-square w-full max-w-[560px] overflow-hidden rounded-full",
        variant === "login" &&
          "drop-shadow-[0_0_70px_rgba(255,255,255,0.42)] shadow-[0_32px_80px_-28px_rgba(0,0,0,0.45)]",
        variant === "default" &&
          "shadow-[0_24px_48px_-12px_rgba(11,116,184,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-[#dbe5ef]/80",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ maxWidth: "100%", height: "100%" }}
      />
      {variant === "login" ? (
        <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.2),transparent_52%)]" />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/25 via-transparent to-[#eff4f9]/35" />
        </>
      )}
    </div>
  );
}
