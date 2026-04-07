import RegisterPageClient from "@/components/auth/RegisterPageClient";

function hasOAuthCredentials(clientId: string | undefined, clientSecret: string | undefined) {
  return Boolean(clientId?.trim() && clientSecret?.trim() && clientId.trim().length > 5 && clientSecret.trim().length > 5);
}

function hasVkClientId(clientId: string | undefined) {
  return Boolean(clientId?.trim() && clientId.trim().length > 3);
}

type SearchParams = Promise<{
  role?: string;
  callbackUrl?: string;
}>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const vkAppId = process.env.VK_CLIENT_ID?.trim() ?? null;
  const vkEnabled = hasVkClientId(process.env.VK_CLIENT_ID);
  const yandexEnabled = hasOAuthCredentials(process.env.YANDEX_CLIENT_ID, process.env.YANDEX_CLIENT_SECRET);
  const initialRole = params.role === "CLIENT" ? "CLIENT" : "RESPONDENT";
  const callbackUrl = params.callbackUrl || "/dashboard";

  return (
    <RegisterPageClient
      vkEnabled={vkEnabled}
      vkAppId={vkAppId}
      yandexEnabled={yandexEnabled}
      initialRole={initialRole}
      callbackUrl={callbackUrl}
    />
  );
}
