import Link from "next/link";
import { Camera, Flag, MapPinned, Settings, UsersRound } from "lucide-react";

export const metadata = {
  title: "Studio",
};

const studioCards = [
  {
    title: "Photo Moderation",
    description: "Review new accessibility photos before they appear on public place pages.",
    href: "/studio/photos",
    icon: Camera,
    enabled: true,
  },
  {
    title: "Places",
    description: "Review manual place submissions before they appear in public discovery.",
    href: "/studio/places",
    icon: MapPinned,
    enabled: true,
  },
  {
    title: "Contributors",
    description: "Support community members and account lifecycle work.",
    href: "/studio/contributors",
    icon: UsersRound,
    enabled: false,
  },
  {
    title: "Reports",
    description: "Review community reports and follow-up requests.",
    href: "/studio/reports",
    icon: Flag,
    enabled: false,
  },
  {
    title: "Settings",
    description: "Future workspace settings and operating controls.",
    href: "/studio/settings",
    icon: Settings,
    enabled: false,
  },
];

export default function StudioPage() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Studio</p>
      <h1 className="mt-2 text-3xl font-semibold">Management workspace</h1>
      <p className="mt-3 max-w-3xl leading-7 text-muted">
        Review community contributions and keep public accessibility information clear,
        useful, and trustworthy.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {studioCards.map((card) => {
          const Icon = card.icon;
          const content = (
            <div className="h-full border border-line bg-surface p-5">
              <Icon className="text-brand" size={24} aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
              {!card.enabled ? (
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Coming later
                </p>
              ) : null}
            </div>
          );

          return card.enabled ? (
            <Link className="block focus:outline focus:outline-2 focus:outline-brand" href={card.href} key={card.href}>
              {content}
            </Link>
          ) : (
            <div aria-disabled="true" key={card.href}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
