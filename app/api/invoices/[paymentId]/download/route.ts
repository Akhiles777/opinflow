import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateCorporateInvoicePdf } from "@/lib/invoice-pdf";
import { SERVICE_PROVIDER_DETAILS } from "@/lib/billing-details";

function parseMetadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { paymentId } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      userId: true,
      amount: true,
      createdAt: true,
      metadata: true,
      description: true,
    },
  });

  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const metadata = parseMetadata(payment.metadata);
  const buyer = parseMetadata(metadata.buyer);
  const seller = parseMetadata(metadata.seller);
  const invoiceNumber =
    typeof metadata.invoiceNumber === "string" && metadata.invoiceNumber.trim()
      ? metadata.invoiceNumber.trim()
      : payment.id.slice(0, 8).toUpperCase();

  const rawDescription = payment.description || "Пополнение баланса платформы «ПотокМнений»";
  const shortDescription = rawDescription.length > 60
    ? rawDescription.slice(0, 57) + "…"
    : rawDescription;

  const pdfBuffer = await generateCorporateInvoicePdf({
    invoiceNumber,
    invoiceDate: payment.createdAt,
    amount: Number(payment.amount),
    serviceDescription: rawDescription,
    tableServiceName: shortDescription,
    seller: {
      companyName: typeof seller.companyName === "string" ? seller.companyName : SERVICE_PROVIDER_DETAILS.companyName,
      inn: typeof seller.inn === "string" ? seller.inn : SERVICE_PROVIDER_DETAILS.inn,
      legalAddress:
        typeof seller.legalAddress === "string" ? seller.legalAddress : SERVICE_PROVIDER_DETAILS.legalAddress,
      bankName: typeof seller.bankName === "string" ? seller.bankName : SERVICE_PROVIDER_DETAILS.bankName,
      bankAccount:
        typeof seller.bankAccount === "string" ? seller.bankAccount : SERVICE_PROVIDER_DETAILS.bankAccount,
      bankBik: typeof seller.bankBik === "string" ? seller.bankBik : SERVICE_PROVIDER_DETAILS.bankBik,
    },
    buyer: {
      companyName: typeof buyer.companyName === "string" ? buyer.companyName : "Заказчик",
      inn: typeof buyer.inn === "string" ? buyer.inn : null,
      legalAddress: typeof buyer.legalAddress === "string" ? buyer.legalAddress : null,
      contactName: typeof buyer.contactName === "string" ? buyer.contactName : null,
      email: typeof buyer.email === "string" ? buyer.email : null,
      bankName: typeof buyer.bankName === "string" ? buyer.bankName : null,
      bankAccount: typeof buyer.bankAccount === "string" ? buyer.bankAccount : null,
      bankBik: typeof buyer.bankBik === "string" ? buyer.bankBik : null,
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
