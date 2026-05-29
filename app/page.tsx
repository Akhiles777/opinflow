import Header from "@/components/layout/Header";
import Hero from "@/components/sections/Hero";
import Features from "@/components/sections/Features";
import WhoItsFor from "@/components/sections/WhoItsFor";
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import Pricing from "@/components/sections/Pricing";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ПотокМнений — маркетинговые исследования за 5 минут",
  description: "Запустите опрос, получите ответы от 25 000+ проверенных респондентов и аналитику с ИИ. Быстро, прозрачно, без агентств.",
};

export default function Home() {
  return (
    <main className="bg-white dark:bg-[#1C0C4C] text-site-body dark:text-white overflow-hidden">
      <Header />
      <Hero />
      <Features />
      <WhoItsFor />
      <WhyChooseUs />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
