"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createLoginSchema,
  type LoginFormValues,
} from "@/modules/auth/schemas/login.schema";
import { Checkbox, Input, Label } from "@/shared/components/ui";
import {
  authenticateUser,
  setClientAuthCookie,
} from "@/shared/lib/auth";
import { cn } from "@/shared/lib/utils";

type LoginFormProps = {
  className?: string;
  /** Тёмная панель как на split-screen логине (белый CTA, поля на чёрном фоне). */
  variant?: "light" | "dark";
};

export function LoginForm({ className, variant = "light" }: LoginFormProps) {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isDark = variant === "dark";

  const schema = useMemo(
    () =>
      createLoginSchema({
        loginRequired: t("validation.loginRequired"),
        passwordRequired: t("validation.passwordRequired"),
        passwordMin: t("validation.passwordMin"),
      }),
    [t],
  );

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      login: "",
      password: "",
      remember: true,
    },
    mode: "onSubmit",
  });

  const onSubmit = handleSubmit(async (values) => {
    const authenticatedUser = authenticateUser(values.login, values.password);

    if (!authenticatedUser) {
      toast.error(t("toast.errorTitle"), {
        description: t("toast.errorDescription"),
      });
      return;
    }

    setClientAuthCookie(authenticatedUser.id, values.remember ?? true);
    toast.success(t("toast.successTitle"), {
      description: `${authenticatedUser.name} — ${authenticatedUser.title}`,
    });
    router.push(`/${locale}/directions`);
    router.refresh();
  });

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "mb-8 text-center",
          isDark && "text-left sm:text-center",
        )}
      >
        <h1
          className={cn(
            "text-balance text-3xl font-semibold tracking-tight sm:text-4xl",
            isDark ? "text-white" : "text-[#0f172a]",
          )}
        >
          {t("projectName")}
        </h1>
        <div
          className={cn(
            "mt-4 text-base font-semibold tracking-tight",
            isDark ? "text-white" : "text-[#1f2f40]",
          )}
        >
          {t("headline")}
        </div>
        <p
          className={cn(
            "mt-2 text-sm",
            isDark ? "text-white/45" : "text-[#5f6f81]",
          )}
        >
          {t("subhead")}
        </p>
      </div>

      <form
        className={cn(
          "grid gap-5",
          isDark ? "rounded-2xl p-0" : "rounded-xl border border-[#dbe5ef] bg-white p-6",
        )}
        onSubmit={onSubmit}
        noValidate
      >
        <div className="grid gap-2">
          <Label
            htmlFor="login"
            className={cn(isDark ? "text-white/90" : "text-[#3f556c]")}
          >
            {t("loginLabel")}
          </Label>
          <Input
            id="login"
            type="text"
            autoComplete="username"
            placeholder={t("loginPlaceholder")}
            className={cn(
              "h-11 rounded-lg",
              isDark
                ? "border border-white/15 bg-white/5 text-white placeholder:text-white/35 focus-visible:border-white/25 focus-visible:ring-white/10"
                : "rounded-md border-[#dbe5ef] bg-white text-[#0f172a] placeholder:text-[#8da1b3] focus-visible:ring-[#0b74b8]/10",
              errors.login && "border-destructive",
            )}
            aria-invalid={Boolean(errors.login)}
            {...register("login")}
          />
          {errors.login?.message ? (
            <p
              className={cn(
                "text-sm",
                isDark ? "text-rose-400" : "text-destructive",
              )}
            >
              {errors.login.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-4">
            <Label
              htmlFor="password"
              className={cn(isDark ? "text-white/90" : "text-[#3f556c]")}
            >
              {t("passwordLabel")}
            </Label>
            <button
              type="button"
              className={cn(
                "h-auto px-0 text-xs transition-colors",
                isDark
                  ? "text-white/40 hover:text-white/65"
                  : "text-[#5f6f81] hover:text-[#0f172a]",
              )}
              onClick={() => toast.info(t("demoHint"))}
            >
              {t("forgotPassword")}
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              className={cn(
                "h-11 rounded-lg pr-11",
                isDark
                  ? "border border-white/15 bg-white/5 text-white placeholder:text-white/35 focus-visible:border-white/25 focus-visible:ring-white/10"
                  : "rounded-md border-[#dbe5ef] bg-white text-[#0f172a] placeholder:text-[#8da1b3] focus-visible:ring-[#0b74b8]/10",
                errors.password && "border-destructive",
              )}
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <button
              type="button"
              className={cn(
                "absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5",
                isDark
                  ? "text-white/45 hover:bg-white/10 hover:text-white/75"
                  : "text-[#5f6f81] hover:bg-[#f5f8fb] hover:text-[#0f172a]",
              )}
              aria-label={
                isPasswordVisible ? t("hidePassword") : t("showPassword")
              }
              onClick={() => setIsPasswordVisible((v) => !v)}
            >
              {isPasswordVisible ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {errors.password?.message ? (
            <p
              className={cn(
                "text-sm",
                isDark ? "text-rose-400" : "text-destructive",
              )}
            >
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4">
          <Controller
            control={control}
            name="remember"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) =>
                    field.onChange(Boolean(checked))
                  }
                  className={cn(
                    isDark
                      ? "border-white/30 bg-white/5 data-[checked]:border-white data-[checked]:bg-white data-[checked]:text-[#0a0a0c]"
                      : "border-[#b9cad9] data-[checked]:border-[#0b74b8] data-[checked]:bg-[#0b74b8] data-[checked]:text-white",
                  )}
                />
                <span
                  className={cn(
                    "text-sm",
                    isDark ? "text-white/80" : "text-[#5f6f81]",
                  )}
                >
                  {t("rememberMe")}
                </span>
              </div>
            )}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "h-12 w-full rounded-lg text-sm font-semibold transition",
            isDark
              ? "bg-white text-neutral-950 shadow-sm hover:bg-white/90 disabled:opacity-60"
              : "rounded-md bg-[#0b74b8] text-white hover:bg-[#085f96]",
          )}
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
