"use client";

import { cn } from "@/shared/lib/utils";

/** Sidebar vertical ornament - shapkanavigornaments */
export function OrnamentSidebar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute right-0 top-0 h-full w-16 overflow-hidden rounded-r-lg",
        className
      )}
      aria-hidden
    >
      <div
        className="h-full w-full bg-right bg-no-repeat"
        style={{
          backgroundImage: "url(/shapkanavigornaments.png)",
          backgroundSize: "cover",
        }}
      />
    </div>
  );
}

/** Космический фон с звёздами — фиксированные позиции для hydration */
const STARS = [
  { x: 5, y: 10, s: 1, d: 0 }, { x: 15, y: 25, s: 1.5, d: 0.5 }, { x: 25, y: 8, s: 1, d: 1 },
  { x: 35, y: 40, s: 2, d: 1.5 }, { x: 45, y: 15, s: 1, d: 0.2 }, { x: 55, y: 60, s: 1.5, d: 2 },
  { x: 65, y: 30, s: 1, d: 0.8 }, { x: 75, y: 75, s: 2, d: 1.2 }, { x: 85, y: 20, s: 1, d: 0.4 },
  { x: 92, y: 50, s: 1.5, d: 1.8 }, { x: 10, y: 70, s: 1, d: 1 }, { x: 30, y: 55, s: 1.5, d: 0.6 },
  { x: 50, y: 85, s: 1, d: 2.2 }, { x: 70, y: 12, s: 2, d: 0.3 }, { x: 88, y: 35, s: 1, d: 1.4 },
];

function CosmicStars() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#00BFFF]/60 animate-star-twinkle"
          style={{
            width: star.s,
            height: star.s,
            left: `${star.x}%`,
            top: `${star.y}%`,
            animationDelay: `${star.d}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Один орнамент на фон — широко, красиво + космический эффект */
export function OrnamentBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden
    >
      {/* Космический градиент */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 70% 50%, rgba(0,175,255,0.08) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 20% 80%, rgba(0,153,204,0.05) 0%, transparent 40%), linear-gradient(180deg, #eef5fc 0%, #f0f7fc 50%, #e8f4fc 100%)",
        }}
      />
      <CosmicStars />
      <div
        className="absolute right-0 top-1/2 h-[90vh] w-[min(320px,28vw)] -translate-y-1/2 bg-right bg-no-repeat opacity-[0.06] animate-cosmic-shimmer"
        style={{
          backgroundImage: "url(/ornamentskaz.webp)",
          backgroundSize: "contain",
        }}
      />
    </div>
  );
}

/** Decorative corner accent */
export function OrnamentCorner({
  position = "top-left",
  className,
}: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}) {
  const rotations: Record<string, string> = {
    "top-left": "rotate-0",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90",
  };
  const positions: Record<string, string> = {
    "top-left": "left-0 top-0",
    "top-right": "right-0 top-0",
    "bottom-right": "right-0 bottom-0",
    "bottom-left": "left-0 bottom-0",
  };

  return (
    <div
      className={cn(
        "absolute h-16 w-16 opacity-20",
        positions[position],
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        className={cn("h-full w-full text-[#00BFFF]", rotations[position])}
      >
        <path
          fill="currentColor"
          d="M0 0h4v4c0 4-2 8-4 12v4h4c4 0 8-2 12-4h4v4h4V0H0zm8 8c2 0 4 2 4 4 0 2-2 4-4 4-2 0-4-2-4-4 0-2 2-4 4-4z"
        />
      </svg>
    </div>
  );
}

type OrnamentProps = {
  variant?: "vertical" | "horizontal";
  className?: string;
  color?: string;
};

/** Main ornament component - flexible */
export function Ornament({
  variant = "vertical",
  className,
  color = "#00BFFF",
}: OrnamentProps) {
  if (variant === "vertical") {
    return (
      <div className={cn("flex h-full w-8 items-stretch", className)}>
        <svg
          viewBox="0 0 32 200"
          className="h-full w-full"
          style={{ color }}
        >
          <defs>
            <pattern
              id="ornament-vert"
              x="0"
              y="0"
              width="32"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                fill="currentColor"
                d="M16 0c-2 4-4 8-4 12 0 4 2 8 4 10 2 2 4 4 8 4 4 0 8-2 10-4 2-2 4-6 4-10 0-4-2-8-4-12-2-4-4-6-8-6-4 0-6 2-8 6zm0 25c2-2 4-4 4-8 0-4-2-6-4-6-2 0-4 2-4 6 0 4 2 6 4 8z"
              />
            </pattern>
          </defs>
          <rect width="32" height="200" fill="url(#ornament-vert)" />
        </svg>
      </div>
    );
  }

  return null;
}
