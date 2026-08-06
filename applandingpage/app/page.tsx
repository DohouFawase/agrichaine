import FaqSection from "@/components/ux/faqSection";
import FeatureSection from "@/components/ux/feactureSection";
import HeroSection from "@/components/ux/heroSection";
import HowItWorksSection from "@/components/ux/howItWorksSection";
import ProblemSection from "@/components/ux/problemSection";
import SignupFormSection from "@/components/ux/signupFormSection";
import SolutionSection from "@/components/ux/solutionSection";
import WhySignUpNowSection from "@/components/ux/whySignUpNowSetion";


export default function Home() {
  return (
    <>
      <div className="">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <HowItWorksSection />
        <FeatureSection />
        <WhySignUpNowSection />
        <SignupFormSection />   
        <FaqSection />   
      </div>
    </>
  );
}
