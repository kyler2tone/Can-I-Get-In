import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasswordField } from "@/components/auth/password-field";

describe("password field accessibility", () => {
  it("uses password-manager friendly autocomplete values", () => {
    render(
      <>
        <PasswordField label="Password" name="password" autoComplete="current-password" />
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
        />
      </>,
    );

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute("minlength", "12");
  });

  it("has an accessible show and hide control", () => {
    render(<PasswordField label="Password" name="password" autoComplete="new-password" />);

    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });
});
