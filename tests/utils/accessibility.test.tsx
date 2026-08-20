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
import {
  accessibilityFactorOptions,
  emptyAccessibilityObservations,
  getAccessibilityFactorStatusLabel,
  isAccessibilityStatusAllowedForFactor,
} from "@/lib/accessibility-factors";
import {
  accessibilityDeveloperPrompt,
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
    expect(parsed.observations.curb_cut.evidence_source).toBe("contributor");
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
      evidence_source: "none",
    };

    const normalized = normalizeAnalysisOutput(output);

    expect(normalized.observations.accessible_restroom.status).toBe("unknown");
    expect(normalized.observations.accessible_restroom.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("supports curb cut without implying a building ramp", () => {
    const parsed = accessibilityAnalysisSchema.parse({
      ...validAnalysisOutput(),
      observations: {
        ...validAnalysisOutput().observations,
        curb_cut: {
          status: "yes",
          confidence: 0.9,
          evidence_summary: "A contributor reported curb cuts near the route to the entrance.",
          evidence_source: "contributor",
        },
        ramp_present: {
          status: "unknown",
          confidence: 0.9,
          evidence_summary: "The route does not clearly show a ramp used to overcome a level change.",
          evidence_source: "none",
        },
      },
    });

    expect(parsed.observations.curb_cut.status).toBe("yes");
    expect(parsed.observations.ramp_present.status).toBe("unknown");
  });

  it("supports a ramp without implying a curb cut", () => {
    const parsed = accessibilityAnalysisSchema.parse({
      ...validAnalysisOutput(),
      observations: {
        ...validAnalysisOutput().observations,
        ramp_present: {
          status: "yes",
          confidence: 0.9,
          evidence_summary: "The route photo shows a ramp along the entrance path.",
          evidence_source: "photo",
        },
        curb_cut: {
          status: "unknown",
          confidence: 0.9,
          evidence_summary: "No parking-to-sidewalk transition is visible.",
          evidence_source: "none",
        },
      },
    });

    expect(parsed.observations.ramp_present.status).toBe("yes");
    expect(parsed.observations.curb_cut.status).toBe("unknown");
  });

  it("allows not needed for ramp present without using counter text", () => {
    const parsed = accessibilityAnalysisSchema.parse({
      ...validAnalysisOutput(),
      observations: {
        ...validAnalysisOutput().observations,
        ramp_present: {
          status: "not_needed",
          confidence: 0.9,
          evidence_summary: "The contributor reported there was no level change requiring a ramp.",
          evidence_source: "contributor",
        },
      },
    });

    expect(parsed.observations.ramp_present.status).toBe("not_needed");
    expect(getAccessibilityFactorStatusLabel("ramp_present", "not_needed")).toBe("Not needed");
    expect(getAccessibilityFactorStatusLabel("ramp_present", "not_applicable")).toBe("Not documented");
    expect(getAccessibilityFactorStatusLabel("ramp_present", "not_applicable")).not.toBe("No counter or front desk");
  });

  it("keeps accessibility status options scoped to their factor", () => {
    expect(accessibilityFactorOptions.ramp_present.map((option) => option.value)).toEqual([
      "yes",
      "no",
      "not_needed",
      "unknown",
    ]);
    expect(isAccessibilityStatusAllowedForFactor("ramp_present", "not_needed")).toBe(true);
    expect(isAccessibilityStatusAllowedForFactor("ramp_present", "not_applicable")).toBe(false);
    expect(isAccessibilityStatusAllowedForFactor("counter_access", "not_applicable")).toBe(true);
    expect(isAccessibilityStatusAllowedForFactor("counter_access", "not_needed")).toBe(false);
  });

  it("supports semantic non-applicable states without collapsing them to no", () => {
    const parsed = accessibilityAnalysisSchema.parse({
      ...validAnalysisOutput(),
      observations: {
        ...validAnalysisOutput().observations,
        automatic_door: {
          status: "no_door_on_site",
          confidence: 0.9,
          evidence_summary: "The documented area is an open outdoor plaza with no door.",
          evidence_source: "photo",
        },
        accessible_restroom: {
          status: "no_restroom_on_site",
          confidence: 0.8,
          evidence_summary: "A contributor reported no restroom on site.",
          evidence_source: "contributor",
        },
        counter_access: {
          status: "not_applicable",
          confidence: 0.8,
          evidence_summary: "No counter or front desk is part of the documented public experience.",
          evidence_source: "contributor",
        },
        elevator: {
          status: "not_needed",
          confidence: 0.8,
          evidence_summary: "The public areas documented are on one accessible level.",
          evidence_source: "contributor",
        },
      },
    });

    expect(parsed.observations.automatic_door.status).toBe("no_door_on_site");
    expect(parsed.observations.accessible_restroom.status).toBe("no_restroom_on_site");
    expect(parsed.observations.counter_access.status).toBe("not_applicable");
    expect(parsed.observations.elevator.status).toBe("not_needed");
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
      input: Array<{ content: Array<{ type: string; text?: string }> }>;
      text: { format: { type: string; strict: boolean } };
    };
    const promptPayload = JSON.parse(String(body.input[1].content[0].text)) as {
      factors: Array<{ key: string }>;
    };

    expect(fetcherMock).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.any(Object));
    expect(body.input[1].content.some((item) => item.type === "input_image")).toBe(true);
    expect(body.text.format).toMatchObject({ type: "json_schema", strict: true });
    expect(promptPayload.factors.map((factor) => factor.key)).toContain("curb_cut");
  });

  it("passes contributor observations with human-readable provenance labels", async () => {
    const fetcherMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ output_text: JSON.stringify(validAnalysisOutput()) }),
    }));

    await requestAccessibilityAnalysis({
      model: "gpt-5-nano",
      placeId: "place-1",
      photos: [],
      contributorEvidence: [
        {
          observations: { counter_access: "no", curb_cut: "yes" },
          notes: "Counter looked high. Curb cuts were off to both sides.",
          createdAt: "2026-08-18T12:00:00Z",
        },
      ],
      fetcher: fetcherMock as unknown as typeof fetch,
    });

    const [, init] = fetcherMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as { input: Array<{ content: Array<{ text?: string }> }> };
    const promptPayload = JSON.parse(String(body.input[1].content[0].text)) as {
      contributorEvidence: Array<{ observations: Record<string, { value: string; label: string }> }>;
    };

    expect(promptPayload.contributorEvidence[0].observations.counter_access).toEqual({
      value: "no",
      label: "No",
    });
    expect(promptPayload.contributorEvidence[0].observations.curb_cut.label).toBe("Yes");
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
    expect(format.schema.properties.observations.required).toContain("curb_cut");
    expect(format.schema.properties.observations.required).toContain("counter_access");
    expect(format.schema.properties.observations.required).toContain("elevator");
    expect(format.schema.properties.observations.properties.curb_cut.required).toContain(
      "evidence_source",
    );
  });

  it("keeps conservative and practical summary guidance in the model prompt", () => {
    const prompt = accessibilityDeveloperPrompt();

    expect(prompt).toContain("Do not enumerate every Accessibility at a Glance status");
    expect(prompt).toContain("Contributor observations are evidence");
    expect(prompt).toContain("Absence from a photograph does not mean no");
    expect(prompt).toContain("Keep ramp_present separate from curb_cut");
    expect(prompt).toContain("with or without high-visibility paint");
    expect(prompt).toContain("what would be useful for me to know before I go here");
    expect(prompt).toContain("Do not tell visitors to call ahead");
    expect(prompt).toContain("staff assistance may be mentioned only as a possible practical option");
    expect(prompt).toContain("For elevator, use yes, no, not_needed, or unknown");
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
    expect(screen.getAllByText("Unknown")).toHaveLength(10);
    expect(screen.getByText("AI accessibility summary")).toBeInTheDocument();
  });

  it("places curb cut immediately after accessible parking", () => {
    render(
      <AccessibilityGlance
        observations={emptyAccessibilityObservations()}
        summary="More photos of the entrance and parking area would help."
      />,
    );

    const labels = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);

    expect(labels.slice(0, 10)).toEqual([
      "Step-free entrance",
      "Automatic door",
      "Ramp present",
      "Accessible parking",
      "Curb cut",
      "Accessible restroom",
      "Interior route",
      "Seating access",
      "Counter / Front Desk",
      "Elevator",
    ]);
  });

  it("does not render removed public score or legacy outcome sections", () => {
    render(
      <AccessibilityGlance
        observations={emptyAccessibilityObservations()}
        summary="A contributor reported curb cuts nearby. More entrance photos would help."
      />,
    );

    expect(screen.queryByText(/Community confidence/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Current summary/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Factual observations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/May require assistance/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Insufficient information/i)).not.toBeInTheDocument();
  });

  it("uses factor-specific labels when rendering shared status values", () => {
    render(
      <AccessibilityGlance
        observations={[
          {
            factor: "ramp_present",
            label: "Ramp present",
            status: "not_needed",
            confidence: 0.9,
            evidenceSummary: "The entrance is level.",
            evidenceSource: "contributor",
          },
          {
            factor: "counter_access",
            label: "Counter / Front Desk",
            status: "not_applicable",
            confidence: 0.9,
            evidenceSummary: "No counter is part of this place.",
            evidenceSource: "contributor",
          },
          {
            factor: "ramp_present",
            label: "Ramp present",
            status: "not_applicable",
            confidence: 0.9,
            evidenceSummary: "Invalid legacy cross-field value.",
            evidenceSource: "contributor",
          },
        ]}
        summary="Accessibility information is still being documented."
      />,
    );

    expect(screen.getByText("Not needed")).toBeInTheDocument();
    expect(screen.getByText("Not applicable / no counter or front desk")).toBeInTheDocument();
    expect(screen.queryByText("No counter or front desk")).not.toBeInTheDocument();
  });
});

function validAnalysisOutput(): AccessibilityAnalysisOutput {
  return {
    observations: {
      step_free_entrance: {
        status: "yes",
        confidence: 0.92,
        evidence_summary: "The entrance approach appears level in the approved photos.",
        evidence_source: "photo",
      },
      automatic_door: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "No automatic door control is visible.",
        evidence_source: "none",
      },
      ramp_present: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "Ramp evidence is not visible.",
        evidence_source: "none",
      },
      accessible_parking: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "No parking photos are available.",
        evidence_source: "none",
      },
      curb_cut: {
        status: "yes",
        confidence: 0.9,
        evidence_summary: "A contributor reported curb cuts near the route to the entrance.",
        evidence_source: "contributor",
      },
      accessible_restroom: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "No restroom photos are available.",
        evidence_source: "none",
      },
      interior_route: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "Interior route evidence is not available.",
        evidence_source: "none",
      },
      seating_access: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "Seating evidence is not available.",
        evidence_source: "none",
      },
      counter_access: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "Counter evidence is not available.",
        evidence_source: "none",
      },
      elevator: {
        status: "unknown",
        confidence: 0.9,
        evidence_summary: "Elevator evidence is not available.",
        evidence_source: "none",
      },
    },
    public_summary:
      "Recent community photos show a step-free entrance. A contributor reported curb cuts nearby.",
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
