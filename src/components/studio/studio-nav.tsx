import Link from "next/link";
import { Camera, Flag, MapPinned, Settings, UsersRound } from "lucide-react";

const studioNavItems = [
  { href: "/studio/photos", label: "Photo Moderation", icon: Camera, enabled: true },
  { href: "/studio/places", label: "Places", icon: MapPinned, enabled: false },
  { href: "/studio/contributors", label: "Contributors", icon: UsersRound, enabled: false },
  { href: "/studio/reports", label: "Reports", icon: Flag, enabled: false },
  { href: "/studio/settings", label: "Settings", icon: Settings, enabled: false },
];

export function StudioNav() {
  return (
    <nav aria-label="Studio tools" className="border border-line bg-surface p-3">
      <Link className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-white" href="/studio">
        Studio Home
      </Link>
      <div className="mt-2 space-y-1">
        {studioNavItems.map((item) => {
          const Icon = item.icon;

          return item.enabled ? (
            <Link
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-white"
              href={item.href}
              key={item.href}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted"
              key={item.href}
            >
              <Icon size={16} aria-hidden="true" />
              {item.label}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
