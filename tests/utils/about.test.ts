import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("About page navigation", () => {
  it("provides a real About route", () => {
    const source = readFileSync("src/app/about/page.tsx", "utf8");

    expect(source).toContain("Can I Get In?");
    expect(source).toContain("See a place before you go.");
    expect(source).toContain("How AI helps");
  });

  it("points navigation and footer links to /about instead of a dead anchor", () => {
    const headerSource = readFileSync("src/components/site-header-client.tsx", "utf8");
    const shellSource = readFileSync("src/components/page-shell.tsx", "utf8");

    expect(headerSource).toContain('href: "/about"');
    expect(shellSource).toContain('href: "/about"');
    expect(headerSource).not.toContain("/#about");
    expect(shellSource).not.toContain("/#about");
  });
});
