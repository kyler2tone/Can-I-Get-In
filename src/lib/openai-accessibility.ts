import {
  accessibilityAnalysisSchema,
  contributorObservationLabel,
  evidenceFingerprint,
  getApprovedEvidenceForAnalysis,
  markAccessibilityAnalysisFailed,
  normalizeAnalysisOutput,
  saveAccessibilityAnalysis,
  type AccessibilityAnalysisOutput,
} from "@/lib/accessibility";
import { accessibilityFactors, accessibilityStatusValues } from "@/lib/accessibility-factors";
import { getSupabaseServerClient } from "@/lib/supabase";

const responsesUrl = "https://api.openai.com/v1/responses";
const defaultAccessibilityModel = "gpt-5-nano";

export function getAccessibilityModel() {
  return process.env.OPENAI_ACCESSIBILITY_MODEL?.trim() || defaultAccessibilityModel;
}

export async function analyzePlaceAccessibility(placeId: string) {
  const evidence = await getApprovedEvidenceForAnalysis(placeId);
  const fingerprint = evidenceFingerprint(evidence);
  const model = getAccessibilityModel();
  const supabase = await getSupabaseServerClient();

  const { data: latestSucceeded } = await supabase
    .from("place_ai_analyses")
    .select("id")
    .eq("place_id", placeId)
    .eq("evidence_fingerprint", fingerprint)
    .eq("status", "succeeded")
    .maybeSingle();

  if (latestSucceeded) {
    return { status: "skipped" as const, reason: "unchanged_evidence" as const };
  }

  const { data: analysisId, error } = await supabase.rpc("mark_place_ai_analysis_pending", {
    p_place_id: placeId,
    p_model: model,
    p_fingerprint: fingerprint,
  });

  if (error || !analysisId) {
    throw new Error("Accessibility analysis could not be queued.");
  }

  if (!evidence.photos.length && !evidence.contributorEvidence.length) {
    const output = unknownOnlyOutput("No approved photo or contributor evidence is available yet.");
    await saveAccessibilityAnalysis({
      placeId,
      analysisId: String(analysisId),
      model,
      fingerprint,
      output,
      imagesAnalyzed: 0,
      usageMetadata: {},
    });
    return { status: "completed" as const, analysisId: String(analysisId), imagesAnalyzed: 0 };
  }

  try {
    const output = await requestAccessibilityAnalysis({
      model,
      placeId,
      photos: evidence.photos,
      contributorEvidence: evidence.contributorEvidence,
    });
    await saveAccessibilityAnalysis({
      placeId,
      analysisId: String(analysisId),
      model,
      fingerprint,
      output: normalizeAnalysisOutput(output),
      imagesAnalyzed: evidence.photos.length,
      usageMetadata: {},
    });
    return { status: "completed" as const, analysisId: String(analysisId), imagesAnalyzed: evidence.photos.length };
  } catch (error) {
    await markAccessibilityAnalysisFailed({
      analysisId: String(analysisId),
      errorMessage: error instanceof Error ? error.message : "OpenAI analysis failed.",
    });
    return { status: "failed" as const, analysisId: String(analysisId) };
  }
}

export async function requestAccessibilityAnalysis({
  model,
  placeId,
  photos,
  contributorEvidence,
  fetcher = fetch,
}: {
  model: string;
  placeId: string;
  photos: Array<{ id: string; categoryLabel: string; createdAt: string; signedUrl: string }>;
  contributorEvidence: Array<{ observations: Record<string, string>; notes: string | null; createdAt: string }>;
  fetcher?: typeof fetch;
}): Promise<AccessibilityAnalysisOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Accessibility analysis is not configured yet.");
  }

  const response = await fetcher(responsesUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: accessibilityDeveloperPrompt(),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                placeId,
                factors: accessibilityFactors.map((factor) => ({
                  key: factor.key,
                  label: factor.label,
                })),
                photos: photos.map((photo) => ({
                  id: photo.id,
                  category: photo.categoryLabel,
                  uploadedAt: photo.createdAt,
                })),
                contributorEvidence: contributorEvidence.map((item) => ({
                  createdAt: item.createdAt,
                  notes: item.notes,
                  observations: Object.fromEntries(
                    Object.entries(item.observations).map(([factor, value]) => [
                      factor,
                      {
                        value,
                        label: contributorObservationLabel(value),
                      },
                    ]),
                  ),
                })),
              }),
            },
            ...photos.map((photo) => ({
              type: "input_image",
              image_url: photo.signedUrl,
              detail: "low",
            })),
          ],
        },
      ],
      text: {
        format: accessibilityJsonSchemaFormat(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI analysis request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  const text =
    payload.output_text ??
    payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;

  if (!text) {
    throw new Error("OpenAI analysis returned no structured output.");
  }

  return accessibilityAnalysisSchema.parse(JSON.parse(text));
}

export function accessibilityDeveloperPrompt() {
  return [
    "Analyze community accessibility evidence conservatively.",
    "Do not declare the place accessible, inaccessible, ADA compliant, or legally compliant.",
    "Use yes only when the evidence clearly supports the factor.",
    "Use no only when the evidence clearly shows absence or a barrier for the named factor.",
    "Contributor observations are evidence. Preserve nuanced contributor-reported states instead of collapsing them into generic yes or no.",
    "Use unknown when evidence is missing, ambiguous, cropped, conflicting, or not visible.",
    "Absence from a photograph does not mean no. Lack of evidence means unknown.",
    "For automatic_door, use automatic, door_not_automatic, no_door_on_site, or unknown. Do not treat no_door_on_site as a missing automatic door.",
    "For accessible_restroom, use restroom_available, restroom_present_not_accessible, no_restroom_on_site, or unknown. Do not treat no_restroom_on_site as an accessibility failure.",
    "For counter_access, use lower_accessible_height, standing_height, not_applicable, or unknown. Do not collapse not_applicable into no.",
    "For elevator, use yes, no, not_needed, or unknown. Use not_needed when relevant public areas are on one accessible level or an elevator is not relevant.",
    "Look for elevators where relevant in interior, lobby, route-to-destination photos, and contributor notes.",
    "Do not infer measurements such as doorway width or ramp slope from ordinary photos.",
    "Keep ramp_present separate from curb_cut. ramp_present means a ramp used to overcome a level change; curb_cut means the ramped transition between parking or street surface and sidewalk or pedestrian route.",
    "Look for curb cuts in accessible parking, route-to-entrance, entrance overview, and other relevant exterior evidence. They may appear at street-to-sidewalk transitions, next to accessible parking, along either side of an entrance approach, or as a sloped sidewalk transition with or without high-visibility paint.",
    "Set evidence_source to photo, contributor, mixed, conflicting, or none for each factor.",
    "Write concise evidence summaries suitable for product audit; do not include hidden reasoning.",
    "Write a public summary in 2 to 4 natural, practical sentences answering: what would be useful for me to know before I go here?",
    "Do not enumerate every Accessibility at a Glance status. Prioritize meaningful barriers, useful features, contributor experiences, conflicts, important missing information, and helpful photo suggestions.",
    "Avoid database-report phrases like documented evidence, based on the provided evidence, these factors remain unknown, the evidence indicates, or accessibility features have been documented.",
    "When a contributor observation matters, qualify it as a contributor report instead of turning one person's experience into a universal fact.",
    "Do not tell visitors to call ahead, contact the business, check a business website, ask staff to verify accessibility information, or ask staff to investigate unknowns.",
    "When a known limitation is reported, staff assistance may be mentioned only as a possible practical option using may language; never imply assistance is guaranteed.",
  ].join("\n");
}

export function accessibilityJsonSchemaFormat() {
  const observationProperties = Object.fromEntries(
    accessibilityFactors.map((factor) => [
      factor.key,
      {
        type: "object",
        additionalProperties: false,
        required: ["status", "confidence", "evidence_summary", "evidence_source"],
        properties: {
          status: { type: "string", enum: [...accessibilityStatusValues] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          evidence_summary: { type: "string", minLength: 1, maxLength: 500 },
          evidence_source: {
            type: "string",
            enum: ["photo", "contributor", "mixed", "conflicting", "none"],
          },
        },
      },
    ]),
  );

  return {
    type: "json_schema",
    name: "cigi_accessibility_analysis",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["observations", "public_summary"],
      properties: {
        observations: {
          type: "object",
          additionalProperties: false,
          required: accessibilityFactors.map((factor) => factor.key),
          properties: observationProperties,
        },
        public_summary: { type: "string", minLength: 1, maxLength: 700 },
      },
    },
  };
}

function unknownOnlyOutput(reason: string): AccessibilityAnalysisOutput {
  return {
    observations: Object.fromEntries(
      accessibilityFactors.map((factor) => [
        factor.key,
        {
          status: "unknown",
          confidence: 1,
          evidence_summary: reason,
          evidence_source: "none",
        },
      ]),
    ) as AccessibilityAnalysisOutput["observations"],
    public_summary: "Accessibility information is still being documented for this place.",
  };
}
