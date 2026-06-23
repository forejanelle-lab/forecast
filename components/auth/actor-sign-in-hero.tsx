import { Logo } from "@/components/layout/logo";
import { Clapperboard, Sparkles, Star } from "lucide-react";

export function ActorSignInHero() {
  return (
    <div className="relative flex w-full items-center justify-center p-12 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#1a1028_0%,#2d1f3d_35%,#1a1816_70%,#0f1419_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,168,107,0.35),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.18),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_55%)]" />
      <div className="absolute top-1/4 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute bottom-10 left-10 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="absolute top-16 left-1/3 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative max-w-md">
        <div className="mb-8">
          <Logo imageClassName="h-14" />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm mb-6">
          <Sparkles className="h-3.5 w-3.5 text-[#e8d5a8]" />
          Actor portal
        </span>

        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
          Step back into your{" "}
          <span className="bg-gradient-to-r from-[#c8a86b] via-[#e8d5a8] to-[#f5d0a8] bg-clip-text text-transparent">
            spotlight
          </span>
        </h2>

        <p className="text-white/65 leading-relaxed mb-8">
          Auditions, role submissions, and casting conversations — everything you
          need to land your next role, in one beautiful workspace.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-white/80">
            <Clapperboard className="h-3.5 w-3.5 text-accent" />
            Self tapes
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-white/80">
            <Star className="h-3.5 w-3.5 text-[#e8d5a8]" />
            Callbacks
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs text-white/80">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
            Premium profile
          </span>
        </div>
      </div>
    </div>
  );
}
