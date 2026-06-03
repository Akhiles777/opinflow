import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateCorporateInvoicePdf } from "@/lib/invoice-pdf";
import { SERVICE_PROVIDER_DETAILS } from "@/lib/billing-details";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get("amount"));

  if (!amount || isNaN(amount) || amount < 100) {
    return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
  }

  const profile = await prisma.clientProfile.findUnique({
    where: { userId: session.user.id },
    select: { companyName: true, inn: true, legalAddress: true, contactName: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  const now = new Date();

  const invoiceRecord = await prisma.invoice.create({
    data: { userId: session.user.id },
  });
  const invoiceNumber = String(invoiceRecord.id);

  const pdfBuffer = await generateCorporateInvoicePdf({
    invoiceNumber,
    invoiceDate: now,
    amount,
    serviceDescription: "Пополнение баланса платформы «ПотокМнений»",
    tableServiceName: "Пополнение баланса платформы «ПотокМнений»",
    seller: {
      companyName: SERVICE_PROVIDER_DETAILS.companyName,
      inn: SERVICE_PROVIDER_DETAILS.inn,
      legalAddress: SERVICE_PROVIDER_DETAILS.legalAddress,
      bankName: SERVICE_PROVIDER_DETAILS.bankName,
      bankAccount: SERVICE_PROVIDER_DETAILS.bankAccount,
      bankBik: SERVICE_PROVIDER_DETAILS.bankBik,
    },
    buyer: {
      companyName: profile?.companyName || user?.name || "Заказчик",
      inn: profile?.inn ?? null,
      legalAddress: profile?.legalAddress ?? null,
      contactName: profile?.contactName ?? user?.name ?? null,
      email: user?.email ?? null,
    },
  });

  const filename = `invoice_${invoiceNumber}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
