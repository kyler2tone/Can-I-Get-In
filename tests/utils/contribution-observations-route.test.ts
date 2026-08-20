import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireCompletedProfile: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requireCompletedProfile: mocks.requireCompletedProfile,
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    from: mocks.from,
  })),
}));

describe("contribution observations route", () => {
  beforeEach(() => {
    mocks.requireCompletedProfile.mockReset();
    mocks.from.mockReset();
    mocks.insert.mockReset();
    mocks.requireCompletedProfile.mockResolvedValue({ user: { id: "22222222-2222-4222-8222-222222222222" } });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ insert: mocks.insert });
  });

  it("accepts 2,000 character accessibility notes", async () => {
    const { POST } = await import("@/app/api/contributions/observations/route");
    const response = await POST(requestWithNotes("a".repeat(2000)));

    expect(response.status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: "a".repeat(2000),
        observations: { elevator: "not_needed" },
      }),
    );
  });

  it("rejects 2,001 character accessibility notes", async () => {
    const { POST } = await import("@/app/api/contributions/observations/route");
    const response = await POST(requestWithNotes("a".repeat(2001)));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toBe("Notes must be 2000 characters or fewer.");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

function requestWithNotes(notes: string) {
  return new Request("https://canigetin.app/api/contributions/observations", {
    method: "POST",
    body: JSON.stringify({
      placeId: "11111111-1111-4111-8111-111111111111",
      photoIds: [],
      observations: {
        elevator: "not_needed",
      },
      notes,
    }),
  });
}
