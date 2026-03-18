"use client";

import createGlobe from "cobe";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";

type GlobeProps = {
  className?: string;
};

export function Globe({ className }: GlobeProps) {
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

    const globe = createGlobe(canvas, {
      devicePixelRatio,
      width: size * devicePixelRatio,
      height: size * devicePixelRatio,
      phi: 0,
      theta: 0.25,
      // Make the globe "light" for a bright UI.
      dark: 1,
      diffuse: 0.9,
      mapSamples: 16000,
      mapBrightness: 2.1,
      baseColor: [0.96, 0.96, 0.98],
      markerColor: [0.82, 0.82, 0.9],
      glowColor: [1, 1, 1],
      markers: [
        { location: [48.01, 80.43], size: 0.09 }, // Семей (Абай обл.)
        { location: [51.16, 71.47], size: 0.08 }, // Астана
        { location: [43.24, 76.91], size: 0.07 }, // Алматы
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.003;
      },
    });

    return () => globe.destroy();
  }, [devicePixelRatio, size]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative aspect-square w-full max-w-[560px] overflow-hidden",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ maxWidth: "100%", height: "100%" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-white/0" />
    </div>
  );
}
