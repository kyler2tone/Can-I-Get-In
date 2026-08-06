import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PasswordUpdateForm } from "@/components/account/account-forms";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

vi.mock("@/lib/actions", () => ({
  changeEmailAction: vi.fn(),
  loginAction: vi.fn(),
  resetPasswordAction: vi.fn(),
  sendMagicLinkAction: vi.fn(),
  signInWithGoogleAction: vi.fn(),
  signupAction: vi.fn(),
  updateAccountPasswordAction: vi.fn(),
}));

describe("password form autocomplete attributes", () => {
  it("marks login credentials for password managers", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  it("marks signup credentials as username and new password fields", () => {
    render(<SignupForm />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute("id", "signup-password");
    expect(screen.getByRole("button", { name: "Sign up" })).toHaveAttribute("type", "submit");
  });

  it("marks account password changes as new password fields", () => {
    render(<PasswordUpdateForm />);

    expect(screen.getByLabelText("New password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("New password")).toHaveAttribute("id", "account-new-password");
    expect(screen.getByRole("button", { name: "Update password" })).toHaveAttribute(
      "type",
      "submit",
    );
  });
});
