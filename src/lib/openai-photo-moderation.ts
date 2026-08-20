import { z } from "zod";
import { getPhotoCategoryLabel, type PhotoCategory } from "@/lib/photo-categories";

const responsesUrl = "https://api.openai.com/v1/responses";
const defaultPhotoModerationModel = "gpt-5-nano";
const autoApproveThreshold = 0.82;

export const photoModerationSchema = z.object({
  decision: z.enum(["approve", "review"]),
  confidence: z.number().min(0).max(1),
  place_photo_valid: z.boolean(),
  category_match: z.boolean(),
  reason: z.string().min(1).max(280),
});

export type PhotoModerationResult = z.infer<typeof photoModerationSchema>;

export function getPhotoModerationModel() {
  return process.env.OPENAI_PHOTO_MODERATION_MODEL?.trim() || defaultPhotoModerationModel;
}

export function shouldAutoApprovePhotoModeration(result: PhotoModerationResult) {
  return (
    result.decision === "approve" &&
    result.confidence >= autoApproveThreshold &&
    result.place_photo_valid &&
    result.category_match
  );
}

export async function moderatePlacePhoto({
  category,
  signedUrl,
  fetcher = fetch,
}: {
  category: PhotoCategory;
  signedUrl: string;
  fetcher?: typeof fetch;
}): Promise<PhotoModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI photo moderation is not configured.");
  }

  const response = await fetcher(responsesUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getPhotoModerationModel(),
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: photoModerationPrompt(category),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Selected category: ${getPhotoCategoryLabel(category)}`,
            },
            {
              type: "input_image",
              image_url: signedUrl,
              detail: "low",
            },
          ],
        },
      ],
      text: {
        format: photoModerationJsonSchemaFormat(),
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI photo moderation request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { output_text?: string; output?: unknown };
  const text = payload.output_text ?? extractOutputText(payload.output);
  if (!text) {
    throw new Error("OpenAI photo moderation did not return structured text.");
  }

  return photoModerationSchema.parse(JSON.parse(text));
}

export function photoModerationJsonSchemaFormat() {
  return {
    type: "json_schema",
    name: "cigi_photo_moderation",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["decision", "confidence", "place_photo_valid", "category_match", "reason"],
      properties: {
        decision: { type: "string", enum: ["approve", "review"] },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        place_photo_valid: { type: "boolean" },
        category_match: { type: "boolean" },
        reason: { type: "string", minLength: 1, maxLength: 280 },
      },
    },
  };
}

function photoModerationPrompt(category: PhotoCategory) {
  return [
    "You are helping moderate community photos for Can I Get In?, an accessibility documentation app.",
    "Decide whether the image is a real-world place photo useful for documenting a public place or accessibility context.",
    "Approve only when the photo appears legitimate, place-relevant, reasonably useful, and reasonably matches the selected category.",
    "Do not require the photo to prove an accessibility feature. Entrances, parking, paths, interiors, restrooms, seating, counters, elevators, and other place context can all be valid.",
    "If the image is ambiguous, low confidence, unrelated, spam-like, unsafe to auto-approve, or category fit is unclear, choose review.",
    "Never choose rejection. Human moderators review uncertain photos.",
    `Selected category key: ${category}. Selected category label: ${getPhotoCategoryLabel(category)}.`,
  ].join("\n");
}

function extractOutputText(output: unknown) {
  if (!Array.isArray(output)) return "";
  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object" || !("content" in item)) return [];
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .map((item) => {
      if (!item || typeof item !== "object") return "";
      const typed = item as { type?: string; text?: string };
      return typed.type === "output_text" && typeof typed.text === "string" ? typed.text : "";
    })
    .join("");
}
