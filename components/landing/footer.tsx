import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-bg-secondary">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          <div className="md:col-span-1">
            <Logo className="mb-4" />
            <p className="text-sm text-text-secondary leading-relaxed">
              The modern operating system for the entertainment industry.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><Link href="/auth/signup/actor" className="hover:text-text-primary transition-colors">Actor Dashboard</Link></li>
              <li><Link href="/auth/signup/casting" className="hover:text-text-primary transition-colors">Casting Dashboard</Link></li>
              <li><Link href="/auth/signup/actor" className="hover:text-text-primary transition-colors">Search</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><span className="hover:text-text-primary transition-colors cursor-pointer">Contact</span></li>
            </ul>
          </div>
        </div>

        <div className="rounded-[20px] gradient-hero p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Ready to transform casting?
            </h3>
            <p className="text-white/60">
              Start building your profile and connecting with casting today.
            </p>
          </div>
          <Link href="/auth/signup/actor">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-secondary">
          <p>&copy; {new Date().getFullYear()} Fore Cast. All rights reserved.</p>
          <p>Designed with elegance. Built for the industry.</p>
        </div>
      </div>
    </footer>
  );
}
