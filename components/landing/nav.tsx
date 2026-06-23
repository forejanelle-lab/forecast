import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";

export function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Logo />

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-white/70 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">
            How It Works
          </Link>
          <Link href="#faq" className="text-sm text-white/70 hover:text-white transition-colors">
            FAQ
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/signin">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              Sign In
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="sm" className="bg-white text-black hover:bg-white/90">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
