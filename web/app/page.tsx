import { Backdrop } from "@/components/visuals/backdrop";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { DataSection } from "@/components/data-section";
import { MinePanel } from "@/components/mine-panel";
import { SkillSection } from "@/components/skill-section";
import { Mechanics } from "@/components/mechanics";

export default function Home() {
  return (
    <>
      <Backdrop />
      <SiteHeader />
      <main>
        <Hero />
        <div className="divider mx-auto max-w-6xl" />
        <HowItWorks />
        <DataSection />
        <MinePanel />
        <div className="divider mx-auto max-w-6xl" />
        <SkillSection />
        <Mechanics />
      </main>
      <SiteFooter />
    </>
  );
}
