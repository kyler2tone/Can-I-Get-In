import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteHeaderClient } from "@/components/site-header-client";

describe("mobile site navigation", () => {
  it("opens and closes a mobile navigation menu with current links", () => {
    render(<SiteHeaderClient sticky profile={null} />);

    const menuButton = screen.getByRole("button", { name: "Open site menu" });
    fireEvent.click(menuButton);
    const mobileMenu = document.getElementById("mobile-site-menu")!;

    expect(mobileMenu).toHaveTextContent("Map");
    expect(mobileMenu).toHaveTextContent("Contribute");
    expect(mobileMenu).toHaveTextContent("About");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.getElementById("mobile-site-menu")).not.toBeInTheDocument();
  });

  it("keeps Studio hidden from contributors and available to Studio roles", () => {
    const { rerender } = render(
      <SiteHeaderClient
        sticky
        profile={{
          displayName: "Connie Contributor",
          initials: "CC",
          avatarUrl: null,
          username: "connie",
          canAccessStudio: false,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open site menu" }));
    expect(document.getElementById("mobile-site-menu")).not.toHaveTextContent("Studio");
    fireEvent.keyDown(document, { key: "Escape" });

    rerender(
      <SiteHeaderClient
        sticky
        profile={{
          displayName: "Mira Moderator",
          initials: "MM",
          avatarUrl: null,
          username: "mira",
          canAccessStudio: true,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open site menu" }));
    expect(document.getElementById("mobile-site-menu")).toHaveTextContent("Studio");
  });
});
