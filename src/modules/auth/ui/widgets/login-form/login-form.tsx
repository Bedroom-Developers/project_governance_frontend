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
};

export function LoginForm({ className }: LoginFormProps) {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
      <div className="mb-8 text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-[#0f172a] sm:text-4xl">
          {t("projectName")}
        </h1>
        <div className="mt-4 text-base font-semibold tracking-tight text-[#1f2f40]">
          {t("headline")}
        </div>
        <p className="mt-2 text-sm text-[#5f6f81]">{t("subhead")}</p>
      </div>

      <form className="grid gap-5 rounded-xl border border-[#dbe5ef] bg-white p-6" onSubmit={onSubmit} noValidate>
        <div className="grid gap-2">
          <Label htmlFor="login" className="text-[#3f556c]">
            {t("loginLabel")}
          </Label>
          <Input
            id="login"
            type="text"
            autoComplete="username"
            placeholder={t("loginPlaceholder")}
            className={cn(
              "h-11 rounded-md border-[#dbe5ef] bg-white text-[#0f172a] placeholder:text-[#8da1b3] focus-visible:ring-[#0b74b8]/10",
              errors.login && "border-destructive",
            )}
            aria-invalid={Boolean(errors.login)}
            {...register("login")}
          />
          {errors.login?.message ? (
            <p className="text-destructive text-sm">{errors.login.message}</p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password" className="text-[#3f556c]">
              {t("passwordLabel")}
            </Label>
            <button
              type="button"
              className="h-auto px-0 text-xs text-[#5f6f81] hover:text-[#0f172a]"
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
                "h-11 rounded-md border-[#dbe5ef] bg-white pr-11 text-[#0f172a] placeholder:text-[#8da1b3] focus-visible:ring-[#0b74b8]/10",
                errors.password && "border-destructive",
              )}
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <button
              type="button"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[#5f6f81] hover:bg-[#f5f8fb] hover:text-[#0f172a]"
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
            <p className="text-destructive text-sm">
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
                  className="border-[#b9cad9] data-[checked]:border-[#0b74b8] data-[checked]:bg-[#0b74b8] data-[checked]:text-white"
                />
                <span className="text-sm text-[#5f6f81]">{t("rememberMe")}</span>
              </div>
            )}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-md bg-[#0b74b8] text-white transition hover:bg-[#085f96]"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
