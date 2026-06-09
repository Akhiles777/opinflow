import { redirect } from "next/navigation";

export default async function OldCompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string>>;
}) {
  const { id } = await params;
  const sp = (await (searchParams ?? Promise.resolve({}))) as Record<string, string>;
  const qs = new URLSearchParams(sp).toString();
  redirect(`/respondent/survey/${id}/complete${qs ? `?${qs}` : ""}`);
}
