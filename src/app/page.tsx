import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { AreasSection } from '@/components/landing/AreasSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <LandingHeader />

      <HeroSection />
      <FeaturesSection />
      <AreasSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}