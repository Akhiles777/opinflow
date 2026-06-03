import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";

type PartyDetails = {
  companyName: string;
  inn?: string | null;
  kpp?: string | null;
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
  tableServiceName?: string;
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
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function sanitize(value?: string | null) {
  return value?.trim() || "—";
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
  const {
    page, text, x, y, maxWidth, size, font,
    lineHeight = size * 1.4,
    color = rgb(0.14, 0.1, 0.38),
  } = params;

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    try {
      const width = font.widthOfTextAtSize(next, size);
      if (width <= maxWidth) { current = next; continue; }
    } catch {
      current = next; continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);

  let currentY = y;
  for (const line of lines) {
    try { page.drawText(line, { x, y: currentY, size, font, color }); } catch { /* skip */ }
    currentY -= lineHeight;
  }
  return currentY;
}

export async function generateCorporateInvoicePdf(input: InvoicePdfInput) {
  const fontBytes = await getFontBytes();

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit as never);

  const regular = await pdf.embedFont(fontBytes.regular);
  const bold    = await pdf.embedFont(fontBytes.bold);

  const page = pdf.addPage([595.28, 841.89]);

  const colors = {
    text:   rgb(0.14, 0.1,  0.38),
    muted:  rgb(0.42, 0.38, 0.58),
    line:   rgb(0.82, 0.78, 0.92),
    accent: rgb(0.31, 0.18, 0.72),
    soft:   rgb(0.95, 0.94, 0.99),
    hdr:    rgb(0.90, 0.87, 0.98),
    white:  rgb(1, 1, 1),
  };

  const marginX = 40;
  const pageW   = 499;  // usable width
  let y = 790;

  // ── Заголовок ───────────────────────────────────────────────────────────────
  page.drawText(`СЧЁТ НА ОПЛАТУ № ${input.invoiceNumber}`, {
    x: marginX, y, size: 16, font: bold, color: colors.text,
  });
  page.drawText(`от ${formatDate(input.invoiceDate)}`, {
    x: 390, y: y + 1, size: 10, font: regular, color: colors.muted,
  });

  y -= 10;
  page.drawLine({
    start: { x: marginX, y }, end: { x: marginX + pageW, y },
    thickness: 1.5, color: colors.accent,
  });
  y -= 18;

  // ── Блок Поставщик / Покупатель ─────────────────────────────────────────────
  const blockH = 108;
  page.drawRectangle({
    x: marginX, y: y - blockH, width: pageW, height: blockH,
    color: colors.soft, borderColor: colors.line, borderWidth: 1,
  });

  // divider
  page.drawLine({
    start: { x: marginX + 250, y }, end: { x: marginX + 250, y: y - blockH },
    thickness: 0.6, color: colors.line,
  });

  // Labels
  page.drawText("Поставщик (Исполнитель):", {
    x: marginX + 8, y: y - 13, size: 8, font: bold, color: colors.accent,
  });
  page.drawText("Покупатель:", {
    x: marginX + 258, y: y - 13, size: 8, font: bold, color: colors.accent,
  });

  // Seller: companyName, ИНН, р/с, Банк, БИК — без адреса, без к/с
  const sellerLines = [
    sanitize(input.seller.companyName),
    `ИНН: ${sanitize(input.seller.inn)}`,
    input.seller.bankAccount ? `р/с: ${sanitize(input.seller.bankAccount)}` : null,
    input.seller.bankName    ? `Банк: ${sanitize(input.seller.bankName)}` : null,
    input.seller.bankBik     ? `БИК: ${sanitize(input.seller.bankBik)}` : null,
  ].filter(Boolean) as string[];

  let sy = y - 28;
  for (const line of sellerLines) {
    sy = drawWrappedText({
      page, text: line, x: marginX + 8, y: sy, maxWidth: 226,
      size: 8.5, font: regular, color: colors.text, lineHeight: 12,
    }) - 3;
  }

  // Buyer: companyName, ИНН, КПП — только эти три поля
  const buyerLines = [
    sanitize(input.buyer.companyName),
    input.buyer.inn ? `ИНН: ${sanitize(input.buyer.inn)}` : null,
    input.buyer.kpp ? `КПП: ${sanitize(input.buyer.kpp)}` : null,
  ].filter(Boolean) as string[];

  let by = y - 28;
  for (const line of buyerLines) {
    by = drawWrappedText({
      page, text: line, x: marginX + 258, y: by, maxWidth: 220,
      size: 8.5, font: regular, color: colors.text, lineHeight: 12,
    }) - 3;
  }

  y -= blockH + 18;

  // ── Основание ───────────────────────────────────────────────────────────────
  page.drawText("Основание:", {
    x: marginX, y, size: 9.5, font: bold, color: colors.accent,
  });
  y = drawWrappedText({
    page,
    text: input.serviceDescription,
    x: marginX + 72, y, maxWidth: pageW - 72,
    size: 9.5, font: regular, color: colors.text, lineHeight: 13,
  });

  y -= 16;

  // ── Таблица услуг ───────────────────────────────────────────────────────────
  // Колонки: №(22) | Наименование(200) | Цена ₽(65) | Кол-во(40) | Ед.изм.(40) | НДС(60) | Сумма ₽(72)
  // Сумма: 22+200+65+40+40+60+72 = 499
  const cW = [22, 200, 65, 40, 40, 60, 72];
  const cX: number[] = [];
  let cx = marginX;
  for (const w of cW) { cX.push(cx); cx += w; }

  const tHeaderH = 26;
  const tRowH    = 24;
  const tTotalH  = tHeaderH + tRowH;

  // Header background
  page.drawRectangle({
    x: marginX, y: y - tHeaderH, width: pageW, height: tHeaderH,
    color: colors.hdr, borderColor: colors.line, borderWidth: 0.8,
  });

  // Header labels
  const hdrLabels = ["№", "Название товара или услуги", "Цена, ₽", "Кол-во", "Ед. изм.", "НДС", "Сумма, ₽"];
  for (let i = 0; i < hdrLabels.length; i++) {
    drawWrappedText({
      page, text: hdrLabels[i],
      x: cX[i] + 4, y: y - 9,
      maxWidth: cW[i] - 6,
      size: 7.5, font: bold, color: colors.text, lineHeight: 9.5,
    });
  }

  // Vertical dividers in header
  for (let i = 1; i < cX.length; i++) {
    page.drawLine({
      start: { x: cX[i], y }, end: { x: cX[i], y: y - tHeaderH },
      thickness: 0.6, color: colors.line,
    });
  }

  // Row background
  page.drawRectangle({
    x: marginX, y: y - tTotalH, width: pageW, height: tRowH,
    color: colors.white, borderColor: colors.line, borderWidth: 0.8,
  });

  const rowY = y - tHeaderH - 8;

  // Vertical dividers in row
  for (let i = 1; i < cX.length; i++) {
    page.drawLine({
      start: { x: cX[i], y: y - tHeaderH }, end: { x: cX[i], y: y - tTotalH },
      thickness: 0.6, color: colors.line,
    });
  }

  // Row data
  const rowData = [
    "1",
    input.tableServiceName ?? input.serviceDescription,
    formatRub(input.amount),
    "1",
    "услуга",
    "Без НДС",
    formatRub(input.amount),
  ];

  for (let i = 0; i < rowData.length; i++) {
    drawWrappedText({
      page, text: rowData[i],
      x: cX[i] + 4, y: rowY,
      maxWidth: cW[i] - 6,
      size: 8, font: regular, color: colors.text, lineHeight: 10,
    });
  }

  y -= tTotalH;

  // Итого строка
  page.drawRectangle({
    x: marginX, y: y - 20, width: pageW, height: 20,
    color: colors.hdr, borderColor: colors.line, borderWidth: 0.8,
  });
  page.drawText("Итого:", {
    x: cX[5] + 4, y: y - 14, size: 8.5, font: bold, color: colors.text,
  });
  page.drawText(`${formatRub(input.amount)} руб.`, {
    x: cX[6] + 4, y: y - 14, size: 8.5, font: bold, color: colors.text,
  });
  page.drawText("Без НДС", {
    x: cX[5] + 4, y: y - 14, size: 8.5, font: regular, color: colors.muted,
  });

  y -= 20 + 22;

  // ── Итого к оплате ──────────────────────────────────────────────────────────
  page.drawText(`Итого к оплате: ${formatRub(input.amount)} руб.`, {
    x: marginX, y, size: 14, font: bold, color: colors.text,
  });

  y -= 22;

  const amountWords = rubles(input.amount);
  page.drawText(`Сумма прописью: ${amountWords}`, {
    x: marginX, y, size: 9, font: regular, color: colors.muted,
  });

  y -= 28;

  // ── Примечание ──────────────────────────────────────────────────────────────
  drawWrappedText({
    page,
    text: "Оплата настоящего счёта подтверждает согласие Покупателя с условиями публичной оферты. Счёт действителен 5 рабочих дней.",
    x: marginX, y, maxWidth: pageW,
    size: 8.5, font: regular, color: colors.muted, lineHeight: 12,
  });

  y -= 50;

  // ── Реквизиты для оплаты ────────────────────────────────────────────────────
  page.drawText("Реквизиты для оплаты:", {
    x: marginX, y, size: 10, font: bold, color: colors.accent,
  });
  y -= 14;

  const reqLines = [
    sanitize(input.seller.companyName),
    `ИНН: ${sanitize(input.seller.inn)}`,
    input.seller.bankName    ? `Банк: ${sanitize(input.seller.bankName)}` : null,
    input.seller.bankAccount ? `р/с: ${sanitize(input.seller.bankAccount)}` : null,
    input.seller.bankBik     ? `БИК: ${sanitize(input.seller.bankBik)}` : null,
  ].filter(Boolean) as string[];

  for (const line of reqLines) {
    drawWrappedText({
      page, text: line, x: marginX, y, maxWidth: pageW,
      size: 9, font: regular, color: colors.text, lineHeight: 13,
    });
    y -= 13;
  }

  return Buffer.from(await pdf.save());
}

// ── Число прописью (рубли) ───────────────────────────────────────────────────
function rubles(amount: number): string {
  const rub = Math.floor(amount);
  const kop = Math.round((amount - rub) * 100);

  const units = ["", "один", "два", "три", "четыре", "пять", "шесть", "семь", "восемь", "девять"];
  const teens = ["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
  const tens  = ["","","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
  const hundreds = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];

  function chunk(n: number, female: boolean): string {
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;
    const parts: string[] = [];
    if (h) parts.push(hundreds[h]);
    if (t === 1) {
      parts.push(teens[u]);
    } else {
      if (t) parts.push(tens[t]);
      if (u) {
        if (female) {
          parts.push(u === 1 ? "одна" : u === 2 ? "две" : units[u]);
        } else {
          parts.push(units[u]);
        }
      }
    }
    return parts.join(" ");
  }

  function rubWord(n: number): string {
    const u = n % 10; const t = n % 100;
    if (t >= 11 && t <= 19) return "рублей";
    if (u === 1) return "рубль";
    if (u >= 2 && u <= 4) return "рубля";
    return "рублей";
  }

  function kopWord(n: number): string {
    const u = n % 10; const t = n % 100;
    if (t >= 11 && t <= 19) return "копеек";
    if (u === 1) return "копейка";
    if (u >= 2 && u <= 4) return "копейки";
    return "kopеек";
  }

  const millions  = Math.floor(rub / 1_000_000);
  const thousands = Math.floor((rub % 1_000_000) / 1_000);
  const rest      = rub % 1_000;

  const parts: string[] = [];

  if (millions) {
    const w = millions % 10;
    const t = millions % 100;
    let word = "миллионов";
    if (t < 11 || t > 19) {
      if (w === 1) word = "миллион";
      else if (w >= 2 && w <= 4) word = "миллиона";
    }
    parts.push(`${chunk(millions, false)} ${word}`);
  }

  if (thousands) {
    const w = thousands % 10;
    const t = thousands % 100;
    let word = "тысяч";
    if (t < 11 || t > 19) {
      if (w === 1) word = "тысяча";
      else if (w >= 2 && w <= 4) word = "тысячи";
    }
    parts.push(`${chunk(thousands, true)} ${word}`);
  }

  if (rest || parts.length === 0) {
    parts.push(`${chunk(rest, false)}`);
  }

  const rubStr = parts.join(" ").replace(/\s+/g, " ").trim();
  const first  = rubStr.charAt(0).toUpperCase() + rubStr.slice(1);

  return `${first} ${rubWord(rub)}, ${String(kop).padStart(2, "0")} ${kopWord(kop)}`;
}
