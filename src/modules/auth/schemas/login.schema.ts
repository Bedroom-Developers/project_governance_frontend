import { z } from "zod";

export type LoginValidationMessages = {
  loginRequired: string;
  passwordRequired: string;
  passwordMin: string;
};

export function createLoginSchema(messages: LoginValidationMessages) {
  return z.object({
    login: z.string().min(1, messages.loginRequired),
    password: z
      .string()
      .min(1, messages.passwordRequired)
      .min(6, messages.passwordMin),
    remember: z.boolean().optional(),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
