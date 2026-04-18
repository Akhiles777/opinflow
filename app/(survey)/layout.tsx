import SurveyHeader from "@/components/respondent/SurveyHeader";
import Providers from "@/components/theme/Providers";

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-surface-950 text-white">
        <SurveyHeader />
        <main className="pt-14">{children}</main>
      </div>
    </Providers>
  );
}
