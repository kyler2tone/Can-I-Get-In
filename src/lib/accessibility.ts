import crypto from "node:crypto";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";
import { objectPathFromDatabasePath } from "@/lib/photo-upload";
import { getPhotoCategoryLabel, type PhotoCategory } from "@/lib/photo-categories";
import {
  accessibilityFactors,
  emptyAccessibilityObservations,
  getAccessibilityFactorLabel,
  isAccessibilityFactor,
  type AccessibilityFactorKey,
  type AccessibilityFactorObservation,
  type AccessibilityStatus,
} from "@/lib/accessibility-factors";

export const contributorObservationValueSchema = z.enum([
  "yes",
  "no",
  "not_sure",
  "did_not_need",
  "comfortable_for_me",
  "difficult_for_me",
  "assistance_needed",
]);

export const contributorObservationSchema = z.object(
  Object.fromEntries(
    accessibilityFactors.map((factor) => [factor.key, contributorObservationValueSchema.optional()]),
  ) as unknown as Record<AccessibilityFactorKey, z.ZodOptional<typeof contributorObservationValueSchema>>,
);

const modelObservationSchema = z.object({
  status: z.enum(["yes", "no", "unknown"]),
  confidence: z.number().min(0).max(1),
  evidence_summary: z.string().min(1).max(500),
});

export const accessibilityAnalysisSchema = z.object({
  observations: z.object(
    Object.fromEntries(
      accessibilityFactors.map((factor) => [
        factor.key,
        modelObservationSchema,
      ]),
    ) as unknown as Record<AccessibilityFactorKey, typeof modelObservationSchema>,
  ),
  public_summary: z.string().min(1).max(700),
});

export type AccessibilityAnalysisOutput = z.infer<typeof accessibilityAnalysisSchema>;

export type AccessibilityEvidencePhoto = {
  id: string;
  category: PhotoCategory;
  categoryLabel: string;
  createdAt: string;
  signedUrl: string;
};

export type ContributorEvidence = {
  observations: Record<string, string>;
  notes: string | null;
  createdAt: string;
};

type ObservationRow = {
  factor: string;
  status: AccessibilityStatus;
  confidence: number | string | null;
  evidence_summary: string | null;
};

type ContributorEvidenceRow = {
  observations: Record<string, string> | null;
  notes: string | null;
  created_at: string;
};

export async function getPublicAccessibilityIntelligence(placeId: string) {
  const supabase = await getSupabaseServerClient();
  const [{ data: observations }, { data: analysis }] = await Promise.all([
    supabase
      .from("place_accessibility_observations")
      .select("factor, status, confidence, evidence_summary")
      .eq("place_id", placeId),
    supabase
      .from("place_ai_analyses")
      .select("status, public_summary, analyzed_at")
      .eq("place_id", placeId)
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const byFactor = new Map<AccessibilityFactorKey, AccessibilityFactorObservation>(
    ((observations ?? []) as ObservationRow[])
      .filter((row) => isAccessibilityFactor(row.factor))
      .map((row) => [
        row.factor as AccessibilityFactorKey,
        {
          factor: row.factor as AccessibilityFactorKey,
          label: getAccessibilityFactorLabel(row.factor),
          status: row.status,
          confidence: Number(row.confidence ?? 0),
          evidenceSummary: row.evidence_summary ?? "",
        } satisfies AccessibilityFactorObservation,
      ]),
  );
  const latestAnalysis = Array.isArray(analysis) ? analysis[0] : null;

  const emptyObservations = emptyAccessibilityObservations();

  return {
    observations: accessibilityFactors.map(
      (factor) => byFactor.get(factor.key) ?? emptyObservations.find((item) => item.factor === factor.key)!,
    ),
    publicSummary:
      latestAnalysis?.public_summary ??
      "Accessibility information is still being documented for this place.",
    analyzedAt: latestAnalysis?.analyzed_at ?? null,
  };
}

export async function getApprovedEvidenceForAnalysis(placeId: string) {
  const supabase = await getSupabaseServerClient();
  const [{ data: photos }, { data: contributorEvidence }] = await Promise.all([
    supabase
      .from("place_photos")
      .select("id, storage_path, category, created_at")
      .eq("place_id", placeId)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("contributor_place_observations")
      .select("observations, notes, created_at")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const evidencePhotos = await Promise.all(
    ((photos ?? []) as Array<{
      id: string;
      storage_path: string;
      category: PhotoCategory;
      created_at: string;
    }>).map(async (photo) => {
      const { data: signed } = await supabase.storage
        .from("place-photos")
        .createSignedUrl(objectPathFromDatabasePath(photo.storage_path), 60 * 20);

      return signed?.signedUrl
        ? {
            id: photo.id,
            category: photo.category,
            categoryLabel: getPhotoCategoryLabel(photo.category),
            createdAt: photo.created_at,
            signedUrl: signed.signedUrl,
          }
        : null;
    }),
  );

  const photosWithUrls: AccessibilityEvidencePhoto[] = evidencePhotos.filter(
    (photo): photo is NonNullable<typeof photo> => Boolean(photo),
  );

  return {
    photos: photosWithUrls,
    contributorEvidence: ((contributorEvidence ?? []) as ContributorEvidenceRow[]).map((item) => ({
      observations: item.observations ?? {},
      notes: item.notes,
      createdAt: item.created_at,
    })),
  };
}

export function evidenceFingerprint({
  photos,
  contributorEvidence,
}: {
  photos: Pick<AccessibilityEvidencePhoto, "id" | "category" | "createdAt">[];
  contributorEvidence: ContributorEvidence[];
}) {
  const payload = {
    photoIds: photos.map((photo) => `${photo.id}:${photo.category}:${photo.createdAt}`).sort(),
    contributorEvidence: contributorEvidence.map((item) => ({
      observations: item.observations,
      notes: item.notes,
      createdAt: item.createdAt,
    })),
  };

  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function normalizeAnalysisOutput(output: AccessibilityAnalysisOutput): AccessibilityAnalysisOutput {
  const normalized = accessibilityAnalysisSchema.parse(output);

  for (const factor of accessibilityFactors) {
    const observation = normalized.observations[factor.key];
    if (observation.status === "unknown") {
      observation.confidence = Math.max(observation.confidence, 0.8);
    }
  }

  return normalized;
}

export async function saveAccessibilityAnalysis({
  placeId,
  analysisId,
  model,
  fingerprint,
  output,
  imagesAnalyzed,
  usageMetadata,
}: {
  placeId: string;
  analysisId: string;
  model: string;
  fingerprint: string;
  output: AccessibilityAnalysisOutput;
  imagesAnalyzed: number;
  usageMetadata: Record<string, unknown>;
}) {
  const supabase = await getSupabaseServerClient();
  const now = new Date().toISOString();

  await supabase
    .from("place_ai_analyses")
    .update({
      status: "succeeded",
      model,
      evidence_fingerprint: fingerprint,
      public_summary: output.public_summary,
      images_analyzed: imagesAnalyzed,
      usage_metadata: usageMetadata,
      analyzed_at: now,
      error_message: null,
    })
    .eq("id", analysisId);

  await Promise.all(
    accessibilityFactors.map((factor) => {
      const observation = output.observations[factor.key];

      return supabase.from("place_accessibility_observations").upsert(
        {
          place_id: placeId,
          analysis_id: analysisId,
          factor: factor.key,
          status: observation.status,
          confidence: observation.confidence,
          evidence_summary: observation.evidence_summary,
          source: "ai",
          last_analyzed_at: now,
        },
        { onConflict: "place_id,factor" },
      );
    }),
  );
}

export async function markAccessibilityAnalysisFailed({
  analysisId,
  errorMessage,
}: {
  analysisId: string;
  errorMessage: string;
}) {
  const supabase = await getSupabaseServerClient();
  await supabase
    .from("place_ai_analyses")
    .update({
      status: "failed",
      error_message: errorMessage.slice(0, 500),
      analyzed_at: new Date().toISOString(),
    })
    .eq("id", analysisId);
}

export function contributorObservationLabel(value: string) {
  const labels: Record<string, string> = {
    yes: "Yes",
    no: "No",
    not_sure: "Not sure",
    did_not_need: "Did not need ramp",
    comfortable_for_me: "Comfortable for me",
    difficult_for_me: "Difficult for me",
    assistance_needed: "Assistance was needed",
  };

  return labels[value] ?? value;
}
