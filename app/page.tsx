import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroMain from "@/components/landing/HeroMain";
import StatsBar from "@/components/landing/StatsBar";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import WhoIsItFor from "@/components/landing/WhoIsItFor";
import Pricing from "@/components/landing/Pricing";
import SocialProof from "@/components/landing/SocialProof";
import FAQMain from "@/components/landing/FAQMain";
import CTABottom from "@/components/landing/CTABottom";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ПотокМнений — маркетинговые исследования за 5 минут",
  description: "Запустите опрос, получите ответы от 25 000+ проверенных респондентов и аналитику с ИИ. Быстро, прозрачно, без агентств.",
};

export default function Home() {
  return (
    <main className="bg-white text-site-body overflow-hidden">
      <Header />
      <HeroMain />
      <StatsBar />
      <HowItWorks />
      <Features />
      <WhoIsItFor />
      <Pricing />
      <SocialProof />
      <FAQMain />
      <CTABottom />
      <Footer />
    </main>
  );
}
