import { testimonials } from "@/lib/marketing-content";

export function Testimonials() {
  return (
    <section className="py-24 lg:py-32 bg-bg-primary">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-medium text-accent mb-3 tracking-wide uppercase">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Loved by the industry
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-[20px] bg-bg-secondary border border-border/60 p-8 shadow-[var(--shadow-soft)]"
            >
              <p className="text-text-primary leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent-hover text-sm font-semibold">
                  {t.avatar}
                </div>
                <p className="text-sm font-semibold text-text-primary">{t.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
