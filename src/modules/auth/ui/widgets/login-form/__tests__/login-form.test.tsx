import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginForm } from "../login-form";

describe("LoginForm — форма входа", () => {
  it("отображает поля email и пароль и кнопку отправки", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("emailLabel")).toBeInTheDocument();
    expect(screen.getByLabelText("passwordLabel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "submit" })).toBeInTheDocument();
  });

  it("показывает ошибки валидации при отправке пустой формы", async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    expect(
      await screen.findByText("validation.emailRequired"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("validation.passwordRequired"),
    ).toBeInTheDocument();
  });

  it("переключает видимость пароля по кнопке", () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(
      "passwordLabel",
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleButton = screen.getByRole("button", { name: "showPassword" });
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe("text");
  });
});
