import ResetPasswordPageClient from "@/components/auth/ResetPasswordPageClient";

type PageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return <ResetPasswordPageClient token={params.token ?? ""} />;
}
