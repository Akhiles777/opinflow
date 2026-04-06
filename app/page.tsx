import { auth } from "@/auth";
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

export default async function Home() {
  const session = await auth();

  return (
    <main className="bg-site-bg text-site-body overflow-hidden">
      <Header
        user={
          session?.user
            ? {
                name: session.user.name ?? "Пользователь",
                email: session.user.email ?? "",
                image: session.user.image ?? null,
                role: session.user.role,
              }
            : null
        }
      />
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
