import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessibilityGlance } from "@/components/places/accessibility-glance";
import {
  accessibilityAnalysisSchema,
  evidenceFingerprint,
  getApprovedEvidenceForAnalysis,
  normalizeAnalysisOutput,
  type AccessibilityAnalysisOutput,
} from "@/lib/accessibility";
import { emptyAccessibilityObservations } from "@/lib/accessibility-factors";
import {
  accessibilityJsonSchemaFormat,
  getAccessibilityModel,
  requestAccessibilityAnalysis,
} from "@/lib/openai-accessibility";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  createSignedUrl: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    from: mocks.from,
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: mocks.createSignedUrl,
      })),
    },
  })),
}));

describe("accessibility structured output", () => {
  it("validates complete structured model output", () => {
    const parsed = accessibilityAnalysisSchema.parse(validAnalysisOutput());

    expect(parsed.observations.step_free_entrance.status).toBe("yes");
    expect(parsed.public_summary).toContain("community photos");
  });

  it("rejects malformed model output", () => {
    expect(() =>
      accessibilityAnalysisSchema.parse({
        observations: {
          step_free_entrance: {
            status: "maybe",
            confidence: 2,
            evidence_summary: "",
          },
        },
        public_summary: "",
      }),
    ).toThrow();
  });

  it("preserves unknown instead of forcing unsupported inference", () => {
    const output = validAnalysisOutput();
    output.observations.accessible_restroom = {
      status: "unknown",
      confidence: 0.2,
      evidence_summary: "No restroom photos are available.",
    };

    const normalized = normalizeAnalysisOutput(output);

    expect(normalized.observations.accessible_restroom.status).toBe("unknown");
    expect(normalized.observations.accessible_restroom.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("creates stable evidence fingerprints for unchanged evidence", () => {
    const evidence = {
      photos: [
        { id: "photo-2", category: "parking" as const, createdAt: "2026-08-18T12:00:00Z" },
        { id: "photo-1", category: "entrance_overview" as const, createdAt: "2026-08-17T12:00:00Z" },
      ],
      contributorEvidence: [
        {
          observations: { step_free_entrance: "yes" },
          notes: "Level entrance.",
          createdAt: "2026-08-18T13:00:00Z",
        },
      ],
    };

    expect(evidenceFingerprint(evidence)).toBe(evidenceFingerprint(evidence));
  });
});

describe("approved evidence selection", () => {
  beforeEach(() => {
    mocks.from.mockReset();
    mocks.createSignedUrl.mockReset();
    mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://example.com/photo.jpg" } });
  });

  it("selects approved photos and excludes pending or rejected evidence at the query boundary", async () => {
    const photosQuery = queryMock({
      data: [
        {
          id: "photo-1",
          storage_path: "place-photos/place-1/user-1/photo.jpg",
          category: "entrance_overview",
          created_at: "2026-08-18T12:00:00Z",
        },
      ],
    });
    const contributorQuery = queryMock({ data: [] });
    mocks.from
      .mockReturnValueOnce({ select: vi.fn(() => photosQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => contributorQuery) });

    const evidence = await getApprovedEvidenceForAnalysis("place-1");

    expect(photosQuery.eq).toHaveBeenCalledWith("place_id", "place-1");
    expect(photosQuery.eq).toHaveBeenCalledWith("moderation_status", "approved");
    expect(evidence.photos).toHaveLength(1);
  });
});

describe("OpenAI accessibility request", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.OPENAI_ACCESSIBILITY_MODEL;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_ACCESSIBILITY_MODEL;
  });

  it("uses a configurable cost-aware model default", () => {
    expect(getAccessibilityModel()).toBe("gpt-5-nano");
    process.env.OPENAI_ACCESSIBILITY_MODEL = "gpt-5-mini";
    expect(getAccessibilityModel()).toBe("gpt-5-mini");
  });

  it("uses Responses API image input with strict JSON schema output", async () => {
    const fetcherMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ output_text: JSON.stringify(validAnalysisOutput()) }),
    }));
    const fetcher = fetcherMock as unknown as typeof fetch;

    await requestAccessibilityAnalysis({
      model: "gpt-5-nano",
      placeId: "place-1",
      photos: [
        {
          id: "photo-1",
          categoryLabel: "Entrance Overview",
          createdAt: "2026-08-18T12:00:00Z",
          signedUrl: "https://example.com/signed-photo.jpg",
        },
      ],
      contributorEvidence: [],
      fetcher,
    });

    const [, init] = fetcherMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      input: Array<{ content: Array<{ type: string }> }>;
      text: { format: { type: string; strict: boolean } };
    };

    expect(fetcherMock).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.any(Object));
    expect(body.input[1].content.some((item) => item.type === "input_image")).toBe(true);
    expect(body.text.format).toMatchObject({ type: "json_schema", strict: true });
  });

  it("fails cleanly on OpenAI errors", async () => {
    const fetcher = vi.fn(async () => ({ ok: false, status: 429 })) as unknown as typeof fetch;

    await expect(
      requestAccessibilityAnalysis({
        model: "gpt-5-nano",
        placeId: "place-1",
        photos: [],
        contributorEvidence: [],
        fetcher,
      }),
    ).rejects.toThrow("OpenAI analysis request failed with status 429.");
  });

  it("keeps the OpenAI key out of client components", () => {
    const uploaderSource = readFileSync("src/components/contributions/photo-uploader.tsx", "utf8");
    const updateSource = readFileSync("src/components/places/suggest-update-form.tsx", "utf8");

    expect(uploaderSource).not.toContain("OPENAI_API_KEY");
    expect(updateSource).not.toContain("OPENAI_API_KEY");
  });

  it("defines all required accessibility factors in the JSON schema", () => {
    const format = accessibilityJsonSchemaFormat();

    expect(format.schema.properties.observations.required).toContain("step_free_entrance");
    expect(format.schema.properties.observations.required).toContain("counter_access");
  });
});

describe("public accessibility glance", () => {
  it("renders accessible text equivalents for status icons", () => {
    render(
      <AccessibilityGlance
        observations={emptyAccessibilityObservations()}
        summary="Accessibility information is still being documented."
      />,
    );

    expect(screen.getByText("Accessibility at a glance")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown")).toHaveLength(8);
    expect(screen.getByText("AI accessibility summary")).toBeInTheDocument();
  });
});

function validAnalysisOutput(): AccessibilityAnalysisOutput {
  return {
    observations: {
      step_free_entrance: {
        status: "yes",
        confidence: 0.92,
        evidence_summary: "The entrance approach appears level in the approved photos.",
      },
      automatic_door: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "No automatic door control is visible.",
      },
      ramp_present: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "Ramp evidence is not visible.",
      },
      accessible_parking: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "No parking photos are available.",
      },
      accessible_restroom: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "No restroom photos are available.",
      },
      interior_route: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "Interior route evidence is not available.",
      },
      seating_access: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "Seating evidence is not available.",
      },
      counter_access: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "Counter evidence is not available.",
      },
    },
    public_summary:
      "Recent community photos document a step-free entrance. Restroom, seating, and counter details are still unknown.",
  };
}

function queryMock<T>(result: T) {
  const query = {
    eq: vi.fn(),
    limit: vi.fn(),
    order: vi.fn(),
    then(resolve: (value: T) => void) {
      resolve(result);
    },
  };

  query.eq.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.order.mockReturnValue(query);

  return query;
}
