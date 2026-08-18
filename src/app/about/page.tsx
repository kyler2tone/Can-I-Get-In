import { ArrowRight, Camera, CheckCircle2, MapPinned, Sparkles } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata = {
  title: "About Can I Get In?",
};

const questions = [
  "Is there a step at the entrance?",
  "Is there an automatic door?",
  "What does the route from parking look like?",
  "Is there room to move inside?",
  "What does the restroom actually look like?",
];

const steps = [
  ["Find or add a place", "Start with a real place people visit in daily life."],
  ["Share what can be seen", "Contributors upload accessibility-focused photos and observations."],
  ["See before you go", "CIGI organizes the information into a place page that is easy to scan."],
];

export default function AboutPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">About CIGI</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-foreground sm:text-6xl">
            Can I Get In?
          </h1>
          <p className="mt-5 text-xl font-semibold leading-8 text-brand-strong">
            See a place before you go.
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
            CIGI is a community-powered accessibility guide built around a simple idea:
            practical information is easier to trust when people can actually see it.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <section className="border border-line bg-surface p-6">
            <h2 className="text-2xl font-black">Why CIGI exists</h2>
            <p className="mt-3 leading-7 text-muted">
              Basic access questions can be surprisingly hard to answer before arriving.
              CIGI uses community photos and observations to make those details easier to inspect.
            </p>
            <ul className="mt-5 grid gap-3">
              {questions.map((question) => (
                <li className="flex gap-3 text-sm font-semibold" key={question}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-brand" size={18} aria-hidden="true" />
                  {question}
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-line bg-white p-6">
            <h2 className="text-2xl font-black">How it works</h2>
            <div className="mt-5 grid gap-4">
              {steps.map(([title, body], index) => (
                <article className="grid gap-3 border-t border-line pt-4 sm:grid-cols-[44px_1fr]" key={title}>
                  <span className="grid size-11 place-items-center rounded-full bg-sky-soft font-black text-brand-strong">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-black">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section className="border border-line bg-surface p-6">
            <Sparkles className="text-brand" size={24} aria-hidden="true" />
            <h2 className="mt-3 text-2xl font-black">How AI helps</h2>
            <p className="mt-3 leading-7 text-muted">
              AI helps CIGI interpret community photos and observations, then organize useful
              accessibility information into a quick summary and simple observation cards.
            </p>
            <p className="mt-3 leading-7 text-muted">
              It does not decide whether a place is universally accessible. When CIGI cannot
              determine something reliably, it should say that it is unknown, and visitors can
              inspect the community photos themselves.
            </p>
          </section>

          <section className="border border-line bg-white p-6">
            <Camera className="text-brand" size={24} aria-hidden="true" />
            <h2 className="mt-3 text-2xl font-black">Built by community</h2>
            <p className="mt-3 leading-7 text-muted">
              CIGI becomes more useful as people add places, upload photos, share observations,
              and suggest corrections when information is outdated or incomplete.
            </p>
            <p className="mt-3 leading-7 text-muted">
              Can I Get In? was created for the OpenAI Build for Good Challenge, but the mission
              is bigger than a challenge: make everyday accessibility information easier to find.
            </p>
          </section>
        </div>

        <section className="mt-10 border border-line bg-brand px-6 py-7 text-white">
          <MapPinned size={26} aria-hidden="true" />
          <h2 className="mt-3 text-2xl font-black">Help map accessibility in your community</h2>
          <p className="mt-2 max-w-2xl leading-7 text-white/82">
            Add a place, contribute photos, or help fill in the missing details on a place page.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-brand-strong transition hover:bg-sky-soft focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-white active:translate-y-px motion-reduce:active:translate-y-0"
            href="/contribute"
          >
            Start contributing
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </section>
    </PageShell>
  );
}
