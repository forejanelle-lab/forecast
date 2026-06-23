import {
  BarChart3,
  Film,
  MessageSquare,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

const features = [
  {
    icon: <Users className="h-5 w-5" />,
    title: "Portfolio-Quality Profiles",
    description:
      "Actor profiles that look like premium portfolios. Headshots, reels, credits, and analytics — all in one beautiful space.",
  },
  {
    icon: <Search className="h-5 w-5" />,
    title: "Intelligent Search",
    description:
      "Powerful global search with advanced filtering, saved searches, and instant results for roles and talent.",
  },
  {
    icon: <Film className="h-5 w-5" />,
    title: "Effortless Submissions",
    description:
      "Apply in seconds. Select headshots, resumes, and reels with a workflow designed for speed and confidence.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Modern Messaging",
    description:
      "Professional conversation interface with attachments, read receipts, and real-time notifications.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Deep Analytics",
    description:
      "Visual dashboards for application trends, callback rates, hiring funnels, and career growth insights.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Premium Visibility",
    description:
      "Featured profiles, priority submissions, and career insights that help talent stand out from the crowd.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-16 lg:py-20 bg-bg-primary">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-medium text-accent mb-3 tracking-wide uppercase">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary mb-4">
            Everything casting needs.
            <br />
            Nothing it doesn&apos;t.
          </h2>
          <p className="text-lg text-text-secondary">
            A complete platform built for speed, clarity, and trust — designed
            for both actors and casting directors.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-[20px] bg-bg-secondary border border-border/60 p-8 shadow-[var(--shadow-soft)] transition-all duration-300 hover:shadow-[var(--shadow-card)] hover:border-border"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-bg-sidebar text-accent mb-5 transition-colors group-hover:bg-accent group-hover:text-white">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
