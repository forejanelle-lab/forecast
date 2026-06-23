import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/lib/marketing-content";
import { Check } from "lucide-react";
import Link from "next/link";

export function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32 bg-bg-sidebar">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-medium text-accent mb-3 tracking-wide uppercase">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-text-secondary">
            Start free. Upgrade when you&apos;re ready to accelerate.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[20px] p-8 border transition-all duration-300 ${
                plan.featured
                  ? "bg-text-primary text-white border-text-primary shadow-[var(--shadow-card)] scale-[1.02]"
                  : "bg-bg-secondary border-border/60 shadow-[var(--shadow-soft)]"
              }`}
            >
              {plan.featured && (
                <span className="inline-block text-xs font-medium text-accent mb-4">
                  Most Popular
                </span>
              )}
              <h3
                className={`text-lg font-semibold mb-1 ${
                  plan.featured ? "text-white" : "text-text-primary"
                }`}
              >
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span
                  className={`text-sm ${
                    plan.featured ? "text-white/60" : "text-text-secondary"
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`text-sm mb-6 ${
                  plan.featured ? "text-white/60" : "text-text-secondary"
                }`}
              >
                {plan.description}
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm">
                    <Check
                      className={`h-4 w-4 shrink-0 ${
                        plan.featured ? "text-accent" : "text-success"
                      }`}
                    />
                    <span className={plan.featured ? "text-white/80" : "text-text-secondary"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/actor">
                <Button
                  className="w-full"
                  variant={plan.featured ? "accent" : "secondary"}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
