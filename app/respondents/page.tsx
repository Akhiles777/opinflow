import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RespondentHero from "@/components/sections/respondents/RespondentHero";
import RespondentSteps from "@/components/sections/respondents/RespondentSteps";
import RespondentWhyChoose from "@/components/sections/respondents/RespondentWhyChoose";
import RespondentSurveyTypes from "@/components/sections/respondents/RespondentSurveyTypes";
import RespondentTestimonials from "@/components/sections/respondents/RespondentTestimonials";
import RespondentFAQ from "@/components/sections/respondents/RespondentFAQ";
import RespondentCTA from "@/components/sections/respondents/RespondentCTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Для респондентов — ПотокМнений",
  description: "Зарабатывай на своём мнении. Проходи опросы ведущих компаний и получай реальные деньги — честно и прозрачно.",
};

export default function RespondentsPage() {
  return (
    <main className="bg-white dark:bg-[#160840] text-site-body dark:text-white overflow-x-hidden">
      <Header />
      <RespondentHero />
      <RespondentSteps />
      <RespondentWhyChoose />
      <RespondentSurveyTypes />
      <RespondentTestimonials />
      <RespondentFAQ />
      <RespondentCTA />
      <Footer />
    </main>
  );
}
