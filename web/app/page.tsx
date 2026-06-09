import { Hero } from "@/components/sections/hero";
import { WhatIs } from "@/components/sections/what-is";
import { WhyItExists } from "@/components/sections/why-it-exists";
import { HowItWorks } from "@/components/sections/how-it-works";
import { PrivacyTrust } from "@/components/sections/privacy-trust";
import { WorksWith } from "@/components/sections/works-with";
import { OpenSource } from "@/components/sections/open-source";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";

export default function Home() {
  return (
    <>
      <Hero />
      <WhatIs />
      <WhyItExists />
      <HowItWorks />
      <PrivacyTrust />
      <WorksWith />
      <OpenSource />
      <Faq />
      <FinalCta />
    </>
  );
}
