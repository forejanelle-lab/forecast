import { Logo } from "@/components/layout/logo";
import { Clapperboard, Sparkles } from "lucide-react";

export function CastingAuthHero() {
  return (
    <div className="relative flex w-full items-center justify-center p-12 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_40%,#111827_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(148,163,184,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.15),transparent_55%)]" />
      <div className="absolute top-1/4 -right-16 h-64 w-64 rounded-full bg-slate-400/10 blur-3xl" />
      <div className="absolute bottom-12 left-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative max-w-md">
        <div className="mb-8">
          <Logo imageClassName="h-14" />
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm mb-6">
          <Clapperboard className="h-3.5 w-3.5 text-slate-300" />
          Casting portal
        </span>

        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
          Run casting with{" "}
          <span className="bg-gradient-to-r from-slate-200 via-white to-slate-300 bg-clip-text text-transparent">
            clarity
          </span>
        </h2>

        <p className="text-white/65 leading-relaxed mb-8">
          Projects, submissions, and auditions in one workspace — built for casting
          directors who need speed without sacrificing polish.
        </p>

        <div className="flex items-center gap-2 text-sm text-white/50">
          <Sparkles className="h-4 w-4 text-slate-300" />
          <span>Manage roles, review talent, and move faster.</span>
        </div>
      </div>
    </div>
  );
}
