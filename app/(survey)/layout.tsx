import Providers from "@/components/theme/Providers";


import SurveyHeader from "@/components/respondent/SurveyHeader";


export default function SurveyLayout({ children }: { children: React.ReactNode }) {

    const links = [
    { label: "Главная", href: "#top" },
    { label: "Респондентам", href: "#respondents" },
    { label: "Бизнесу", href: "#business" },
    { label: "О нас", href: "#about" },
    { label: "Контакты", href: "#contacts" },
  ];

  return (
    <div className="min-h-screen  bg-surface-950 text-white">
   

    <SurveyHeader/>

      <Providers><main className="pt-14">{children}</main></Providers>
    </div>
  );
}