import {
  accessibilityStatusMeta,
  type AccessibilityFactorObservation,
} from "@/lib/accessibility-factors";

export function AccessibilityGlance({
  observations,
  summary,
}: {
  observations: AccessibilityFactorObservation[];
  summary: string;
}) {
  return (
    <section className="mt-8 border border-line bg-surface p-5" aria-labelledby="accessibility-glance">
      <h2 id="accessibility-glance" className="text-xl font-semibold">
        Accessibility at a glance
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {observations.map((observation) => {
          const meta = accessibilityStatusMeta[observation.status];
          const Icon = meta.icon;

          return (
            <div className={`rounded-md border p-3 ${meta.className}`} key={observation.factor}>
              <div className="flex items-center gap-2">
                <Icon size={18} aria-hidden="true" />
                <h3 className="text-sm font-semibold">{observation.label}</h3>
              </div>
              <p className="mt-2 text-sm">
                <span className="sr-only">{observation.label}: </span>
                {meta.label}
              </p>
            </div>
          );
        })}
      </div>
      <section className="mt-5 border border-line bg-white p-4" aria-labelledby="ai-summary">
        <h3 id="ai-summary" className="font-semibold">
          AI accessibility summary
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted">{summary}</p>
      </section>
    </section>
  );
}
