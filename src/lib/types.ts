export type EntryOutcome =
  | "likely_independent"
  | "may_require_assistance"
  | "visible_barrier"
  | "insufficient_information";

export type ProfileRole = "contributor" | "moderator" | "admin";

export type Place = {
  slug: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  currentEntryStatus: EntryOutcome;
  currentSummary: string;
  communityConfidence: "low" | "medium" | "high";
  lastVerifiedAt: string;
  observations: Observation[];
  missingInformation: string[];
  photoCategories: string[];
};

export type Observation = {
  label: string;
  value: string;
  confidence: "low" | "medium" | "high";
  source: "contributor" | "mock" | "ai_draft";
};

export type PublicProfile = {
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio: string;
  city: string;
  state: string;
  points: number;
  contributionCount: number;
  role: ProfileRole;
  joinedAt: string;
};
