import { Languages, MoonStar } from "lucide-react";
import type { ReactNode } from "react";

import { AppSidebar } from "@/shared/components/app-sidebar/app-sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#f5f5f9]">
      <div className="flex min-h-[100dvh] w-full">
        <div className="hidden md:block">
          <div className="h-full bg-white shadow-sm">
            <AppSidebar />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="min-h-[100dvh] px-6 py-6 md:px-10 md:py-8">
            <header className="mb-6 flex items-center justify-end gap-2 rounded-xl border border-neutral-200/70 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                  aria-label="Language"
                >
                  <Languages className="size-4" />
                </button>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                  aria-label="Theme"
                >
                  <MoonStar className="size-4" />
                </button>
                <div className="ml-1 flex size-9 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700">
                  U
                </div>
              </div>
            </header>

            <main>{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
