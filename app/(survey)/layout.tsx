import SurveyHeader from "@/components/respondent/SurveyHeader";

export default function SurveyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-site-bg text-site-body">
      <SurveyHeader />
      <main className="pt-14">{children}</main>
    </div>
  );
}
