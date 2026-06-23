const steps = [
  {
    number: "01",
    title: "Create Your Profile",
    description:
      "Actors build portfolio-quality profiles with headshots, reels, credits, and skills. Casting directors set up projects and roles in minutes.",
  },
  {
    number: "02",
    title: "Discover & Connect",
    description:
      "Search roles or talent with intelligent filters. Save favorites, request auditions, and message directly — all from one platform.",
  },
  {
    number: "03",
    title: "Submit & Review",
    description:
      "Actors apply with a few clicks. Casting directors review submissions, request callbacks, and track the hiring funnel in real time.",
  },
  {
    number: "04",
    title: "Audition & Hire",
    description:
      "Self tapes, live auditions, and messaging flow seamlessly. Analytics reveal what's working and where to focus next.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-bg-sidebar">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-medium text-accent mb-3 tracking-wide uppercase">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary mb-4">
            From profile to callback
            <br />
            in four steps
          </h2>
          <p className="text-lg text-text-secondary">
            Every workflow is designed to require as few clicks as possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex gap-6 rounded-[20px] bg-bg-secondary border border-border/60 p-8 shadow-[var(--shadow-soft)]"
            >
              <span className="text-4xl font-bold text-accent/30 leading-none">
                {step.number}
              </span>
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
