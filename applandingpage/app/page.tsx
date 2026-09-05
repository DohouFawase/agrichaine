import FaqSection from "@/components/ux/faqSection";
import FeatureSection from "@/components/ux/feactureSection";
import HeroSection from "@/components/ux/heroSection";
import HowItWorksSection from "@/components/ux/howItWorksSection";
import ProblemSection from "@/components/ux/problemSection";
import SolutionSection from "@/components/ux/solutionSection";



export default function Home() {
  return (
    <>
      <div className="container mx-auto py-12 px-6">
        
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeatureSection />
      <HowItWorksSection />
      <FaqSection />
      </div>
    </>
  );
}
