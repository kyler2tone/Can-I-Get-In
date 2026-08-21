import {
  Camera,
  Compass,
  Flag,
  Lock,
  MapPinned,
  Sprout,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { ContributorBadge } from "@/lib/contributor-impact";

const badgeIcons: Record<string, LucideIcon> = {
  "first-contribution": Flag,
  "click-click": Camera,
  "touched-grass": Sprout,
  "city-starter": MapPinned,
  "local-guide": Compass,
};

export function BadgeEmblem({
  badge,
  showProgress = false,
}: {
  badge: ContributorBadge;
  showProgress?: boolean;
}) {
  const Icon = badge.earned ? badgeIcons[badge.slug] ?? Trophy : Lock;

  return (
    <div
      className={`rounded-md border p-4 ${
        badge.earned
          ? "border-brand/30 bg-white shadow-sm"
          : "border-line bg-white/70 text-muted"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`grid size-14 shrink-0 place-items-center rounded-full border-4 ${
            badge.earned
              ? "border-brand/20 bg-brand text-white"
              : "border-line bg-background text-muted"
          }`}
          aria-hidden="true"
        >
          <Icon size={24} />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{badge.name}</span>
          <span className="mt-1 block text-sm leading-5">
            {badge.earned ? badge.description : badge.progressLabel}
          </span>
        </span>
      </div>
      {showProgress && !badge.earned ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-background" aria-hidden="true">
          <div
            className="h-full bg-brand"
            style={{ width: `${Math.round((badge.progress / badge.target) * 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
