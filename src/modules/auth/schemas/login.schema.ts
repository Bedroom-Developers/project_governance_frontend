import { z } from "zod";

export type LoginValidationMessages = {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMin: string;
};

export function createLoginSchema(messages: LoginValidationMessages) {
  return z.object({
    email: z
      .string()
      .min(1, messages.emailRequired)
      .email(messages.emailInvalid),
    password: z
      .string()
      .min(1, messages.passwordRequired)
      .min(6, messages.passwordMin),
    remember: z.boolean().optional(),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;
