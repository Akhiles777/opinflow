import { redirect } from "next/navigation";

export default async function OldSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/respondent/survey/${id}`);
}
