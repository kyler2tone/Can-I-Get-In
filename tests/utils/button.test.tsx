import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("shared button states", () => {
  it("includes immediate pressed, disabled, and focus feedback classes", () => {
    render(<Button disabled>Save changes</Button>);

    const button = screen.getByRole("button", { name: "Save changes" });
    expect(button).toHaveClass("active:translate-y-px");
    expect(button).toHaveClass("disabled:cursor-not-allowed");
    expect(button).toHaveClass("focus:outline");
    expect(button).toBeDisabled();
  });
});
