import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import ForRespondents from "@/components/sections/ForRespondents";
import ForBusiness from "@/components/sections/ForBusiness";
import Cabinets from "@/components/sections/Cabinets";
import Partners from "@/components/sections/Partners";
import FAQ from "@/components/sections/FAQ";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <ForRespondents />
        <ForBusiness />
        <Cabinets />
        <Partners />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
