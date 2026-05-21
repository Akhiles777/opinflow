import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type PartyDetails = {
  companyName: string;
  inn?: string | null;
  legalAddress?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankBik?: string | null;
  contactName?: string | null;
  email?: string | null;
};

export type InvoicePdfInput = {
  invoiceNumber: string;
  invoiceDate: Date;
  amount: number;
  serviceDescription: string;
  seller: PartyDetails;
  buyer: PartyDetails;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatRub(amount: number) {
  return `${new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} ₽`;
}

function sanitize(value?: string | null) {
  return value?.trim() || "—";
}

function drawWrappedText(params: {
  page: import("pdf-lib").PDFPage;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  size: number;
  font: import("pdf-lib").PDFFont;
  lineHeight?: number;
  color?: ReturnType<typeof rgb>;
}) {
  const {
    page,
    text,
    x,
    y,
    maxWidth,
    size,
    font,
    lineHeight = size * 1.35,
    color = rgb(0.14, 0.1, 0.38),
  } = params;

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(next, size);
    if (width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);

  let currentY = y;
  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size,
      font,
      color,
    });
    currentY -= lineHeight;
  }

  return currentY;
}

export async function generateCorporateInvoicePdf(input: InvoicePdfInput) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595.28, 841.89]);

  const colors = {
    text: rgb(0.14, 0.1, 0.38),
    muted: rgb(0.42, 0.38, 0.58),
    line: rgb(0.86, 0.82, 0.95),
    accent: rgb(0.42, 0.26, 0.9),
    soft: rgb(0.95, 0.94, 0.99),
  };

  const marginX = 48;
  let y = 785;

  page.drawText(`СЧЁТ НА ОПЛАТУ № ${input.invoiceNumber}`, {
    x: marginX,
    y,
    size: 20,
    font: bold,
    color: colors.text,
  });

  page.drawText(`от ${formatDate(input.invoiceDate)}`, {
    x: 395,
    y: y + 2,
    size: 11,
    font: regular,
    color: colors.muted,
  });

  y -= 28;

  page.drawRectangle({
    x: marginX,
    y: y - 120,
    width: 499,
    height: 118,
    color: colors.soft,
    borderColor: colors.line,
    borderWidth: 1,
  });

  page.drawText("Исполнитель", {
    x: marginX + 16,
    y: y - 18,
    size: 11,
    font: bold,
    color: colors.accent,
  });

  page.drawText("Плательщик", {
    x: marginX + 270,
    y: y - 18,
    size: 11,
    font: bold,
    color: colors.accent,
  });

  drawWrappedText({
    page,
    text: [
      sanitize(input.seller.companyName),
      `ИНН: ${sanitize(input.seller.inn)}`,
      input.seller.legalAddress ? `Адрес: ${sanitize(input.seller.legalAddress)}` : "",
      input.seller.bankName ? `Банк: ${sanitize(input.seller.bankName)}` : "",
      input.seller.bankAccount ? `Р/с: ${sanitize(input.seller.bankAccount)}` : "",
      input.seller.bankBik ? `БИК: ${sanitize(input.seller.bankBik)}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    x: marginX + 16,
    y: y - 38,
    maxWidth: 220,
    size: 10,
    font: regular,
    color: colors.text,
  });

  drawWrappedText({
    page,
    text: [
      sanitize(input.buyer.companyName),
      input.buyer.inn ? `ИНН: ${sanitize(input.buyer.inn)}` : "",
      input.buyer.legalAddress ? `Адрес: ${sanitize(input.buyer.legalAddress)}` : "",
      input.buyer.contactName ? `Контакт: ${sanitize(input.buyer.contactName)}` : "",
      input.buyer.email ? `Email: ${sanitize(input.buyer.email)}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    x: marginX + 270,
    y: y - 38,
    maxWidth: 212,
    size: 10,
    font: regular,
    color: colors.text,
  });

  y -= 152;

  page.drawText("Основание оплаты", {
    x: marginX,
    y,
    size: 11,
    font: bold,
    color: colors.accent,
  });

  y = drawWrappedText({
    page,
    text:
      "Пополнение внутреннего баланса платформы «ПотокМнений» и доступ к цифровым сервисам платформы на условиях публичной оферты для Заказчика.",
    x: marginX,
    y: y - 18,
    maxWidth: 500,
    size: 10,
    font: regular,
    color: colors.text,
  });

  y -= 22;

  page.drawRectangle({
    x: marginX,
    y: y - 72,
    width: 499,
    height: 72,
    borderColor: colors.line,
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });

  const cols = [marginX, marginX + 310, marginX + 400, marginX + 480];
  page.drawText("Наименование", { x: cols[0] + 10, y: y - 18, size: 10, font: bold, color: colors.text });
  page.drawText("Кол-во", { x: cols[1] + 10, y: y - 18, size: 10, font: bold, color: colors.text });
  page.drawText("Сумма", { x: cols[2] + 10, y: y - 18, size: 10, font: bold, color: colors.text });

  page.drawLine({ start: { x: marginX, y: y - 28 }, end: { x: marginX + 499, y: y - 28 }, thickness: 1, color: colors.line });
  page.drawLine({ start: { x: cols[1], y: y }, end: { x: cols[1], y: y - 72 }, thickness: 1, color: colors.line });
  page.drawLine({ start: { x: cols[2], y: y }, end: { x: cols[2], y: y - 72 }, thickness: 1, color: colors.line });
  page.drawLine({ start: { x: cols[3], y: y }, end: { x: cols[3], y: y - 72 }, thickness: 1, color: colors.line });

  drawWrappedText({
    page,
    text: input.serviceDescription,
    x: cols[0] + 10,
    y: y - 45,
    maxWidth: 288,
    size: 10,
    font: regular,
    color: colors.text,
  });
  page.drawText("1", { x: cols[1] + 22, y: y - 45, size: 10, font: regular, color: colors.text });
  page.drawText(formatRub(input.amount), { x: cols[2] + 10, y: y - 45, size: 10, font: regular, color: colors.text });

  y -= 98;

  page.drawText(`Итого к оплате: ${formatRub(input.amount)}`, {
    x: marginX,
    y,
    size: 16,
    font: bold,
    color: colors.text,
  });

  y -= 28;

  drawWrappedText({
    page,
    text:
      "Оплата настоящего счёта подтверждает согласие плательщика с условиями публичной оферты для Заказчика. Счёт сформирован в электронном виде и действителен без подписи и печати, если иное не требуется сторонами.",
    x: marginX,
    y,
    maxWidth: 500,
    size: 10,
    font: regular,
    color: colors.muted,
  });

  y -= 70;

  page.drawText("Реквизиты для оплаты", {
    x: marginX,
    y,
    size: 11,
    font: bold,
    color: colors.accent,
  });

  y = drawWrappedText({
    page,
    text: [
      sanitize(input.seller.companyName),
      `ИНН ${sanitize(input.seller.inn)}`,
      input.seller.bankName ? `Банк ${sanitize(input.seller.bankName)}` : "",
      input.seller.bankAccount ? `Расчётный счёт ${sanitize(input.seller.bankAccount)}` : "",
      input.seller.bankBik ? `БИК ${sanitize(input.seller.bankBik)}` : "",
    ]
      .filter(Boolean)
      .join(" · "),
    x: marginX,
    y: y - 18,
    maxWidth: 500,
    size: 10,
    font: regular,
    color: colors.text,
  });

  return Buffer.from(await pdf.save());
}
