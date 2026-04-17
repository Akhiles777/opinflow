import { redirect } from "next/navigation";

export default async function RespondentSurveysRedirect({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const query = params.tab ? `?tab=${encodeURIComponent(params.tab)}` : "";

  redirect(`/surveys${query}`);
}
