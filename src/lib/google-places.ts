import { googlePlaceIdSchema, googleSessionTokenSchema } from "@/lib/place-identity";
import { validCoordinates } from "@/lib/discovery";

const autocompleteUrl = "https://places.googleapis.com/v1/places:autocomplete";
const placeDetailsBaseUrl = "https://places.googleapis.com/v1/places";

const autocompleteFieldMask =
  "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types";

const detailsFieldMask =
  "id,displayName,formattedAddress,location,types,addressComponents";

export type GooglePlaceSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  fullText: string;
  types: string[];
};

export type GooglePlacesSearchContext = {
  latitude?: number | null;
  longitude?: number | null;
};

export type GooglePlaceDetails = {
  googlePlaceId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  category: string;
};

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      types?: string[];
    };
  }>;
};

type DetailsResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
};

export async function searchGooglePlaces({
  input,
  sessionToken,
  context = {},
  fetcher = fetch,
}: {
  input: string;
  sessionToken: string;
  context?: GooglePlacesSearchContext;
  fetcher?: typeof fetch;
}) {
  const apiKey = getGooglePlacesApiKey();
  const normalizedInput = input.trim();
  const parsedToken = googleSessionTokenSchema.safeParse(sessionToken);
  const locationBias = buildLocationBias(context);

  if (normalizedInput.length < 2) return [];
  if (!parsedToken.success) throw new Error("Start a new place search and try again.");

  const response = await fetcher(autocompleteUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": autocompleteFieldMask,
    },
    body: JSON.stringify({
      input: normalizedInput,
      sessionToken: parsedToken.data,
      languageCode: "en",
      regionCode: "us",
      ...(locationBias ? { locationBias } : {}),
    }),
  });

  if (!response.ok) {
    console.warn("[google-places-autocomplete]", {
      upstreamStatus: response.status,
      ...(await readGooglePlacesError(response)),
      hasApiKeyHeader: Boolean(apiKey),
      hasJsonContentTypeHeader: true,
      hasSessionToken: Boolean(parsedToken.data),
    });
    throw new Error("Place search is unavailable right now.");
  }

  const payload = (await response.json()) as AutocompleteResponse;
  return (payload.suggestions ?? [])
    .map((suggestion): GooglePlaceSuggestion | null => {
      const prediction = suggestion.placePrediction;
      const placeId = prediction?.placeId;
      if (!placeId) return null;
      const fullText = prediction.text?.text ?? prediction.structuredFormat?.mainText?.text ?? "Unnamed place";
      const primaryText = prediction.structuredFormat?.mainText?.text ?? fullText;

      return {
        placeId,
        primaryText,
        secondaryText: usefulSecondaryText({
          primaryText,
          structuredSecondaryText: prediction.structuredFormat?.secondaryText?.text ?? "",
          fullText,
        }),
        fullText,
        types: prediction.types ?? [],
      };
    })
    .filter((result): result is GooglePlaceSuggestion => Boolean(result))
    .slice(0, 6);
}

export async function getGooglePlaceDetails({
  placeId,
  sessionToken,
  fetcher = fetch,
}: {
  placeId: string;
  sessionToken: string;
  fetcher?: typeof fetch;
}) {
  const apiKey = getGooglePlacesApiKey();
  const parsedPlaceId = googlePlaceIdSchema.safeParse(placeId);
  const parsedToken = googleSessionTokenSchema.safeParse(sessionToken);

  if (!parsedPlaceId.success) throw new Error("Choose a valid place.");
  if (!parsedToken.success) throw new Error("Start a new place search and try again.");

  const response = await fetcher(
    `${placeDetailsBaseUrl}/${encodeURIComponent(parsedPlaceId.data)}?sessionToken=${encodeURIComponent(parsedToken.data)}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": detailsFieldMask,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Place details are unavailable right now.");
  }

  return transformGooglePlaceDetails((await response.json()) as DetailsResponse);
}

export function transformGooglePlaceDetails(payload: DetailsResponse): GooglePlaceDetails {
  const latitude = Number(payload.location?.latitude);
  const longitude = Number(payload.location?.longitude);
  const name = payload.displayName?.text?.trim() ?? "";
  const address = payload.formattedAddress?.trim() ?? "";
  const components = payload.addressComponents ?? [];
  const city =
    findAddressComponent(components, "locality") ??
    findAddressComponent(components, "postal_town") ??
    findAddressComponent(components, "administrative_area_level_3") ??
    "";
  const state = findAddressComponent(components, "administrative_area_level_1", "shortText") ?? "";
  const postalCode = findAddressComponent(components, "postal_code") ?? "";

  if (!payload.id || !name || !address || !city || !state || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("That place result is missing details needed to add it.");
  }

  return {
    googlePlaceId: payload.id,
    name,
    address,
    city,
    state,
    postalCode,
    latitude,
    longitude,
    category: formatGooglePlaceType(payload.types?.[0]),
  };
}

export function googlePlacesAttributionText() {
  return "Place search results provided by Google.";
}

function getGooglePlacesApiKey() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("Place search is not configured yet.");
  }

  return apiKey;
}

function buildLocationBias(context: GooglePlacesSearchContext) {
  const latitude = Number(context.latitude);
  const longitude = Number(context.longitude);
  if (!validCoordinates({ latitude, longitude })) return null;

  return {
    circle: {
      center: {
        latitude,
        longitude,
      },
      radius: 50000,
    },
  };
}

function usefulSecondaryText({
  primaryText,
  structuredSecondaryText,
  fullText,
}: {
  primaryText: string;
  structuredSecondaryText: string;
  fullText: string;
}) {
  if (structuredSecondaryText.trim()) return structuredSecondaryText.trim();

  const normalizedPrimary = primaryText.trim();
  const normalizedFullText = fullText.trim();
  if (
    normalizedPrimary &&
    normalizedFullText.toLowerCase().startsWith(normalizedPrimary.toLowerCase())
  ) {
    return normalizedFullText.slice(normalizedPrimary.length).replace(/^,\s*/, "").trim();
  }

  return normalizedFullText === normalizedPrimary ? "" : normalizedFullText;
}

async function readGooglePlacesError(response: Response) {
  try {
    const payload = (await response.clone().json()) as {
      error?: {
        status?: string;
        code?: number;
        message?: string;
      };
    };

    return {
      googleErrorStatus: payload.error?.status ?? null,
      googleErrorCode: payload.error?.code ?? null,
      googleErrorMessage: payload.error?.message ?? null,
    };
  } catch {
    return {
      googleErrorStatus: null,
      googleErrorCode: null,
      googleErrorMessage: null,
    };
  }
}

function findAddressComponent(
  components: NonNullable<DetailsResponse["addressComponents"]>,
  type: string,
  textKey: "longText" | "shortText" = "longText",
) {
  return components.find((component) => component.types?.includes(type))?.[textKey]?.trim();
}

function formatGooglePlaceType(value: string | undefined) {
  if (!value) return "Place";

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
