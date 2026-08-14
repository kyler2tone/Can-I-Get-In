import { Camera, MapPinned, ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { ButtonLink } from "@/components/ui/button";

export const metadata = {
  title: "Contribute",
};

const guidance = [
  ["Required", "Full entrance overview", "Show the whole entrance and approach."],
  ["Required", "Close doorway and threshold view", "Capture the door, threshold, handle, and any step."],
  ["Recommended", "Accessible parking and route", "Document parking, curb cuts, surface, and route to the door."],
  ["Optional", "Interior, restroom, seating, checkout", "Add visitor-path details where lawful and appropriate."],
];

export default function ContributePage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold">Contribute accessibility observations</h1>
          <p className="mt-3 text-lg leading-8 text-muted">
            Contributors help visitors plan ahead by uploading factual, photo-supported
            information about public places.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/places/add">
              <MapPinned size={18} aria-hidden="true" />
              Find or add a place
            </ButtonLink>
            <ButtonLink href="/auth/signup" variant="secondary">
              <Camera size={18} aria-hidden="true" />
              Join as a Contributor
            </ButtonLink>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {guidance.map(([level, title, body]) => (
            <div className="border border-line bg-surface p-5" key={title}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {level}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </div>
          ))}
        </div>
        <section className="mt-8 border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 text-accent" aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold">Safety and privacy</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                <li>Do not photograph people in restrooms.</li>
                <li>Avoid intentionally capturing faces or license plates.</li>
                <li>Do not trespass.</li>
                <li>Only photograph from lawful public or customer-accessible locations.</li>
              </ul>
            </div>
          </div>
        </section>
      </section>
    </PageShell>
  );
}
