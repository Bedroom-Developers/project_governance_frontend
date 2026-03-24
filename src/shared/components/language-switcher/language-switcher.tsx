"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";

import { usePathname, useRouter } from "@/shared/configs/i18/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (nextLocale: "ru" | "kk") => {
    if (nextLocale === locale) return;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <div className="flex items-center gap-1 rounded-xl border border-[#00BFFF]/10 bg-white/70 px-1.5 py-1">
      <div
        className="grid size-7 place-items-center rounded-lg text-[#566a7f]"
        aria-hidden
      >
        <Languages className="size-4" />
      </div>
      <button
        type="button"
        onClick={() => switchLocale("ru")}
        className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
          locale === "ru"
            ? "bg-[#00BFFF] text-white"
            : "text-[#566a7f] hover:bg-[#00BFFF]/10 hover:text-[#0099cc]"
        }`}
        aria-label="Switch to Russian"
      >
        RU
      </button>
      <button
        type="button"
        onClick={() => switchLocale("kk")}
        className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
          locale === "kk"
            ? "bg-[#00BFFF] text-white"
            : "text-[#566a7f] hover:bg-[#00BFFF]/10 hover:text-[#0099cc]"
        }`}
        aria-label="Қазақ тіліне ауыстыру"
      >
        KZ
      </button>
    </div>
  );
}
