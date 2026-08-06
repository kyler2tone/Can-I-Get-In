import { render, screen } from "@testing-library/react";
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

