import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-[72vh] gradient-hero overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,168,107,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(200,168,107,0.08),transparent_60%)]" />

      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-28 pb-14">
        <div className="max-w-3xl">
          <div className="animate-fade-in-up mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              The future of casting is here
            </span>
          </div>

          <h1
            className="animate-fade-in-up text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.05] mb-6"
            style={{ animationDelay: "0.1s" }}
          >
            Cast with{" "}
            <span className="text-gradient">confidence</span>
            <br />
            and elegance
          </h1>

          <p
            className="animate-fade-in-up text-lg sm:text-xl text-white/60 max-w-xl leading-relaxed mb-10"
            style={{ animationDelay: "0.2s" }}
          >
            The modern operating system for the entertainment industry.
            Connect actors and casting directors through a premium experience
            that feels effortless, intelligent, and cinematic.
          </p>

          <div
            className="animate-fade-in-up flex flex-col sm:flex-row items-start gap-4"
            style={{ animationDelay: "0.3s" }}
          >
            <Link href="/auth/signup/actor">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 gap-2">
                Start as Actor
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/signup/casting">
              <Button
                size="lg"
                variant="secondary"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 gap-2"
              >
                <Play className="h-4 w-4" />
                Casting Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
