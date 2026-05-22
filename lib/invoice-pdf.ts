import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";

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

let cachedRegular: Uint8Array | null = null;
let cachedBold: Uint8Array | null = null;

async function getFontBytes() {
  if (cachedRegular && cachedBold) return { regular: cachedRegular, bold: cachedBold };

  const base = path.join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf");
  const [regular, bold] = await Promise.all([
    readFile(path.join(base, "DejaVuSans.ttf")),
    readFile(path.join(base, "DejaVuSans-Bold.ttf")),
  ]);

  cachedRegular = new Uint8Array(regular);
  cachedBold = new Uint8Array(bold);
  return { regular: cachedRegular, bold: cachedBold };
}

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
  }).format(amount)} руб.`;
}

function sanitize(value?: string | null) {
  return value?.trim() || "-";
}

type DrawTextParams = {
  page: import("pdf-lib").PDFPage;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  size: number;
  font: import("pdf-lib").PDFFont;
  lineHeight?: number;
  color?: ReturnType<typeof rgb>;
};

function drawWrappedText(params: DrawTextParams): number {
  const { page, text, x, y, maxWidth, size, font, lineHeight = size * 1.35, color = rgb(0.14, 0.1, 0.38) } = params;

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    try {
      const width = font.widthOfTextAtSize(next, size);
      if (width <= maxWidth) {
        current = next;
        continue;
      }
    } catch {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);

  let currentY = y;
  for (const line of lines) {
    try {
      page.drawText(line, { x, y: currentY, size, font, color });
    } catch {
      // skip unencodable chars — should not happen with DejaVu
    }
    currentY -= lineHeight;
  }
  return currentY;
}

export async function generateCorporateInvoicePdf(input: InvoicePdfInput) {
  const fontBytes = await getFontBytes();

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit as never);

  const regular = await pdf.embedFont(fontBytes.regular);
  const bold = await pdf.embedFont(fontBytes.bold);

  const page = pdf.addPage([595.28, 841.89]);

  const colors = {
    text:   rgb(0.14, 0.1, 0.38),
    muted:  rgb(0.42, 0.38, 0.58),
    line:   rgb(0.86, 0.82, 0.95),
    accent: rgb(0.31, 0.18, 0.72),
    soft:   rgb(0.95, 0.94, 0.99),
  };

  const marginX = 48;
  let y = 785;

  // ── Заголовок ──────────────────────────────────────────────────────────────
  page.drawText(`СЧЕТ НА ОПЛАТУ N ${input.invoiceNumber}`, {
    x: marginX, y, size: 18, font: bold, color: colors.text,
  });
  page.drawText(`от ${formatDate(input.invoiceDate)}`, {
    x: 395, y: y + 2, size: 11, font: regular, color: colors.muted,
  });

  y -= 30;

  // ── Блок стороны ───────────────────────────────────────────────────────────
  page.drawRectangle({
    x: marginX, y: y - 120, width: 499, height: 120,
    color: colors.soft, borderColor: colors.line, borderWidth: 1,
  });

  page.drawText("Исполнитель", {
    x: marginX + 14, y: y - 16, size: 10, font: bold, color: colors.accent,
  });
  page.drawText("Плательщик", {
    x: marginX + 268, y: y - 16, size: 10, font: bold, color: colors.accent,
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
    ].filter(Boolean).join(" * "),
    x: marginX + 14, y: y - 34, maxWidth: 220,
    size: 9, font: regular, color: colors.text,
  });

  drawWrappedText({
    page,
    text: [
      sanitize(input.buyer.companyName),
      input.buyer.inn ? `ИНН: ${sanitize(input.buyer.inn)}` : "",
      input.buyer.legalAddress ? `Адрес: ${sanitize(input.buyer.legalAddress)}` : "",
      input.buyer.contactName ? `Контакт: ${sanitize(input.buyer.contactName)}` : "",
      input.buyer.email ? `Email: ${sanitize(input.buyer.email)}` : "",
    ].filter(Boolean).join(" * "),
    x: marginX + 268, y: y - 34, maxWidth: 212,
    size: 9, font: regular, color: colors.text,
  });

  y -= 148;

  // ── Основание оплаты ────────────────────────────────────────────────────────
  page.drawText("Основание оплаты", {
    x: marginX, y, size: 11, font: bold, color: colors.accent,
  });
  y = drawWrappedText({
    page,
    text: "Пополнение внутреннего баланса платформы ПотокМнений и доступ к цифровым сервисам платформы на условиях публичной оферты для Заказчика.",
    x: marginX, y: y - 16, maxWidth: 500,
    size: 10, font: regular, color: colors.text,
  });

  y -= 20;

  // ── Таблица услуг ──────────────────────────────────────────────────────────
  const tableH = 68;
  page.drawRectangle({
    x: marginX, y: y - tableH, width: 499, height: tableH,
    borderColor: colors.line, borderWidth: 1, color: rgb(1, 1, 1),
  });

  const cols = [marginX, marginX + 310, marginX + 400, marginX + 480];

  page.drawText("Наименование", { x: cols[0] + 8, y: y - 16, size: 9, font: bold, color: colors.text });
  page.drawText("Кол-во",       { x: cols[1] + 8, y: y - 16, size: 9, font: bold, color: colors.text });
  page.drawText("Сумма",        { x: cols[2] + 8, y: y - 16, size: 9, font: bold, color: colors.text });

  page.drawLine({ start: { x: marginX,  y: y - 24 }, end: { x: marginX + 499, y: y - 24 }, thickness: 1, color: colors.line });
  page.drawLine({ start: { x: cols[1],  y },           end: { x: cols[1],  y: y - tableH }, thickness: 1, color: colors.line });
  page.drawLine({ start: { x: cols[2],  y },           end: { x: cols[2],  y: y - tableH }, thickness: 1, color: colors.line });
  page.drawLine({ start: { x: cols[3],  y },           end: { x: cols[3],  y: y - tableH }, thickness: 1, color: colors.line });

  drawWrappedText({
    page,
    text: input.serviceDescription,
    x: cols[0] + 8, y: y - 40, maxWidth: 286,
    size: 9, font: regular, color: colors.text,
  });
  page.drawText("1", { x: cols[1] + 20, y: y - 40, size: 9, font: regular, color: colors.text });
  page.drawText(formatRub(input.amount), { x: cols[2] + 8, y: y - 40, size: 9, font: regular, color: colors.text });

  y -= tableH + 20;

  // ── Итого ──────────────────────────────────────────────────────────────────
  page.drawText(`Итого к оплате: ${formatRub(input.amount)}`, {
    x: marginX, y, size: 15, font: bold, color: colors.text,
  });

  y -= 26;

  drawWrappedText({
    page,
    text: "Оплата настоящего счета подтверждает согласие плательщика с условиями публичной оферты для Заказчика. Счет сформирован в электронном виде и действителен без подписи и печати, если иное не требуется сторонами.",
    x: marginX, y, maxWidth: 500,
    size: 9, font: regular, color: colors.muted,
  });

  y -= 60;

  // ── Реквизиты ──────────────────────────────────────────────────────────────
  page.drawText("Реквизиты для оплаты", {
    x: marginX, y, size: 11, font: bold, color: colors.accent,
  });

  drawWrappedText({
    page,
    text: [
      sanitize(input.seller.companyName),
      `ИНН ${sanitize(input.seller.inn)}`,
      input.seller.bankName ? `Банк: ${sanitize(input.seller.bankName)}` : "",
      input.seller.bankAccount ? `Расчетный счет: ${sanitize(input.seller.bankAccount)}` : "",
      input.seller.bankBik ? `БИК: ${sanitize(input.seller.bankBik)}` : "",
    ].filter(Boolean).join(" * "),
    x: marginX, y: y - 16, maxWidth: 500,
    size: 10, font: regular, color: colors.text,
  });

  return Buffer.from(await pdf.save());
}
