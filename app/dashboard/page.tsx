import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "RESPONDENT":
      redirect("/respondent");
    case "CLIENT":
      redirect("/client");
    case "ADMIN":
      redirect("/admin");
    default:
      redirect("/login");
  }
}
