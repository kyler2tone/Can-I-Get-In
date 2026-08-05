type ExportProfile = {
  display_name?: string | null;
  username?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  created_at?: string | null;
  points?: number | null;
  contribution_count?: number | null;
};

export type ContributorExportPayload = {
  exportedAt: string;
  account: {
    id: string;
    email?: string | null;
  };
  profile: ExportProfile | null;
  placesHelped: unknown[];
  uploadedPhotoMetadata: unknown[];
  reports: unknown[];
  verifications: unknown[];
  contributions: unknown[];
  badges: unknown[];
  excluded: string[];
};

function valueOrEmpty(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

export function formatContributorExportText(payload: ContributorExportPayload) {
  const profile = payload.profile;
  const lines = [
    "Can I Get In?",
    "Contributor Data Export",
    "",
    `Exported: ${payload.exportedAt}`,
    "",
    `Display Name: ${valueOrEmpty(profile?.display_name)}`,
    `Username: ${valueOrEmpty(profile?.username)}`,
    `Email: ${valueOrEmpty(payload.account.email)}`,
    `Bio: ${valueOrEmpty(profile?.bio)}`,
    `City: ${valueOrEmpty(profile?.city)}`,
    `State: ${valueOrEmpty(profile?.state)}`,
    `Created: ${valueOrEmpty(profile?.created_at)}`,
    `Points: ${valueOrEmpty(profile?.points)}`,
    `Photos contributed: ${payload.uploadedPhotoMetadata.length}`,
    `Contribution records: ${payload.contributions.length}`,
    `Places helped: ${payload.placesHelped.length}`,
    `Reports submitted: ${payload.reports.length}`,
    `Verifications: ${payload.verifications.length}`,
    `Badges: ${payload.badges.length}`,
    "",
    "Included Sections:",
    "- Profile",
    "- Uploaded photo metadata",
    "- Contribution history",
    "- Places helped",
    "- Reports and verifications",
    "- Badges",
    "",
    "Excluded:",
    ...payload.excluded.map((item) => `- ${item}`),
    "",
  ];

  return lines.join("\n");
}

