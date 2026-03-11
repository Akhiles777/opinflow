import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import TwoAudiences from "@/components/sections/TwoAudiences";
import Stats from "@/components/sections/Stats";
import Cabinets from "@/components/sections/Cabinets";
import About from "@/components/sections/About";
import Partners from "@/components/sections/Partners";
import FAQ from "@/components/sections/FAQ";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="bg-surface-950 text-white overflow-hidden">
      <Header />
      <Hero />
      <TwoAudiences />
      <Stats />
      <Cabinets />
      <About />
      <Partners />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
