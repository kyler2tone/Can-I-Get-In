import type { Place, PublicProfile } from "@/lib/types";

export const rapidCity = {
  name: "Rapid City",
  state: "SD",
  slug: "rapid-city-sd",
  latitude: 44.0805,
  longitude: -103.231,
  status: "phase_1_mapping",
};

export const samplePlaces: Place[] = [
  {
    slug: "main-street-square",
    name: "Main Street Square",
    address: "512 Main St, Rapid City, SD",
    latitude: 44.0819,
    longitude: -103.2264,
    category: "Public plaza",
    currentEntryStatus: "likely_independent",
    currentSummary:
      "Mock Phase 1 record. Open plaza areas appear level from public imagery, but route details and nearby parking need contributor photos.",
    communityConfidence: "medium",
    lastVerifiedAt: "2026-08-03",
    observations: [
      {
        label: "Primary approach",
        value: "Wide paved public plaza area visible",
        confidence: "medium",
        source: "mock",
      },
      {
        label: "Visible steps",
        value: "No steps shown in mock record",
        confidence: "low",
        source: "mock",
      },
    ],
    missingInformation: [
      "Close threshold photos for adjacent businesses",
      "Accessible parking and curb-cut confirmation",
      "Winter surface condition notes",
    ],
    photoCategories: ["entrance_overview", "route_to_entrance", "parking"],
  },
  {
    slug: "journey-museum",
    name: "The Journey Museum",
    address: "222 New York St, Rapid City, SD",
    latitude: 44.0897,
    longitude: -103.2203,
    category: "Museum",
    currentEntryStatus: "insufficient_information",
    currentSummary:
      "Mock Phase 1 record. A contributor needs to document the entrance, route, parking, and interior visitor path before a summary is published.",
    communityConfidence: "low",
    lastVerifiedAt: "2026-08-03",
    observations: [
      {
        label: "Entrance overview",
        value: "Needs contributor photo",
        confidence: "low",
        source: "mock",
      },
      {
        label: "Door operation",
        value: "Unknown",
        confidence: "low",
        source: "mock",
      },
    ],
    missingInformation: [
      "Full entrance overview",
      "Doorway and threshold closeup",
      "Route from accessible parking",
      "Restroom and interior path notes",
    ],
    photoCategories: ["entrance_overview", "doorway_closeup", "parking"],
  },
  {
    slug: "rapid-city-public-library",
    name: "Rapid City Public Library",
    address: "610 Quincy St, Rapid City, SD",
    latitude: 44.0774,
    longitude: -103.2304,
    category: "Library",
    currentEntryStatus: "may_require_assistance",
    currentSummary:
      "Mock Phase 1 record. Entrance appears usable from public context, but doorway operation and threshold details need confirmation.",
    communityConfidence: "medium",
    lastVerifiedAt: "2026-08-03",
    observations: [
      {
        label: "Route surface",
        value: "Sidewalk approach expected",
        confidence: "medium",
        source: "mock",
      },
      {
        label: "Door operation",
        value: "Unknown; may require assistance",
        confidence: "low",
        source: "mock",
      },
    ],
    missingInformation: [
      "Automatic or manual door confirmation",
      "Threshold height estimate",
      "Accessible parking photo",
    ],
    photoCategories: ["entrance_overview", "doorway_closeup", "interior"],
  },
];

export const sampleProfiles: PublicProfile[] = [
  {
    username: "rapidcity-helper",
    displayName: "Rapid City Helper",
    bio: "Phase 1 placeholder profile for public contributor pages.",
    city: "Rapid City",
    state: "SD",
    points: 25,
    contributionCount: 3,
    role: "contributor",
    joinedAt: "2026-08-03",
  },
];

export function getPlaceBySlug(slug: string) {
  return samplePlaces.find((place) => place.slug === slug);
}

export function formatEntryOutcome(outcome: Place["currentEntryStatus"]) {
  const labels = {
    likely_independent: "Likely independent",
    may_require_assistance: "May require assistance",
    visible_barrier: "Visible barrier",
    insufficient_information: "Insufficient information",
  };

  return labels[outcome];
}
