import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

vi.mock("@/lib/actions", () => ({
  resetPasswordAction: vi.fn(),
}));

describe("reset password form", () => {
  it("renders new password and confirm password fields for recovery sessions", () => {
    render(<ResetPasswordForm canResetPassword />);

    expect(screen.getByLabelText("New password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(screen.getByText("At least 12 characters")).toBeInTheDocument();
    expect(screen.getByText("At least one uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("At least one lowercase letter")).toBeInTheDocument();
    expect(screen.getByText("At least one number")).toBeInTheDocument();
  });

  it("enables submission only when the shared password policy passes", () => {
    render(<ResetPasswordForm canResetPassword />);

    const submit = screen.getByRole("button", { name: "Update password" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "StrongerPass12" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "StrongerPass12" },
    });

    expect(submit).toBeEnabled();
  });

  it("blocks use without a valid recovery session", () => {
    render(
      <ResetPasswordForm
        canResetPassword={false}
        initialError="This password reset link is invalid or expired. Request a new reset email."
      />,
    );

    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new reset email" })).toHaveAttribute(
      "href",
      "/auth/forgot-password",
    );
  });
});
