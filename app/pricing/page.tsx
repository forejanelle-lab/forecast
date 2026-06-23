import { Footer } from "@/components/landing/footer";
import { LandingNav } from "@/components/landing/nav";
import { Pricing } from "@/components/landing/pricing";

export default function PricingPage() {
  return (
    <>
      <LandingNav />
      <div className="pt-16">
        <Pricing />
      </div>
      <Footer />
    </>
  );
}
