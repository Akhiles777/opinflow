import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";
import type { AnalysisDiagnostics, AnalysisResult } from "@/lib/ai-analysis";
import type { QuantQuestionBlock } from "@/lib/survey-quantitative";

let cachedFontBytes: Uint8Array | null = null;

async function getCyrillicFontBytes() {
  if (cachedFontBytes) return cachedFontBytes;

  const candidates = [
    path.join(process.cwd(), "node_modules/dejavu-fonts-ttf/ttf/DejaVuSans.ttf"),
    path.join(process.cwd(), "node_modules/dejavu-fonts-ttf/DejaVuSans.ttf"),
  ];

  for (const filePath of candidates) {
    try {
      const data = await readFile(filePath);
      cachedFontBytes = new Uint8Array(data);
      return cachedFontBytes;
    } catch {
      // try next candidate
    }
  }

  throw new Error("PDF_FONT_NOT_FOUND");
}

function wrapText(text: string, maxChars = 95) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateSurveyPDF(params: {
  survey: { id: string; title: string; category?: string | null };
  analysis: AnalysisResult | null;
  stats: { totalResponses: number; completionRate: number; avgTimeMinutes: number; questionCount: number };
  quantitative?: QuantQuestionBlock[];
  diagnostics?: AnalysisDiagnostics | null;
}): Promise<Buffer> {
  try {
    const pdf = await PDFDocument.create();
    const typedFontkit = fontkit as unknown as Parameters<typeof pdf.registerFontkit>[0];
    pdf.registerFontkit(typedFontkit);
    const fontBytes = await getCyrillicFontBytes();
    const regular = await pdf.embedFont(fontBytes);
    const bold = regular;
    let page = pdf.addPage([595.28, 841.89]); // A4
    const { width } = page.getSize();
    const x = 36;
    let y = 805;
    const line = 16;
    const barTrackW = width - 2 * x - 200;
    const barH = 5;

    const newPage = () => {
      page = pdf.addPage([595.28, 841.89]);
      y = 805;
    };

    const drawLines = (lines: string[], options?: { size?: number; color?: [number, number, number]; gap?: number }) => {
      const size = options?.size ?? 11;
      const color = options?.color ?? [0.1, 0.11, 0.14];
      const gap = options?.gap ?? line;
      for (const textLine of lines) {
        if (y < 60) break;
        page.drawText(textLine, { x, y, size, font: regular, color: rgb(color[0], color[1], color[2]) });
        y -= gap;
      }
    };

    const analysis = params.analysis;
    const generatedAt = new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());
    const title = params.survey.title || "Отчет по опросу";
    page.drawText(title.slice(0, 80), { x, y, size: 21, font: bold, color: rgb(0.07, 0.08, 0.12) });
    y -= 26;
    drawLines([`${params.survey.category || "Маркетинговое исследование"} • Сформирован ${generatedAt}`], {
      size: 10,
      color: [0.4, 0.44, 0.5],
      gap: 14,
    });
    y -= 6;

    page.drawText("Ключевые показатели", { x, y, size: 14, font: bold, color: rgb(0.1, 0.11, 0.14) });
    y -= 18;
    drawLines(
      [
        `Ответов: ${params.stats.totalResponses}`,
        `Завершили: ${params.stats.completionRate}%`,
        `Среднее время: ${params.stats.avgTimeMinutes} мин`,
        `Вопросов: ${params.stats.questionCount}`,
      ],
      { size: 11, gap: 15 },
    );
    y -= 6;

    const quantitative = params.quantitative ?? [];
    if (quantitative.length > 0) {
      page.drawText("Количественные распределения", { x, y, size: 14, font: bold, color: rgb(0.1, 0.11, 0.14) });
      y -= 18;

      for (const block of quantitative.slice(0, 6)) {
        if (y < 100) {
          newPage();
        }
        drawLines([`«${block.title.slice(0, 72)}» (${block.type}, n=${block.totalAnswers})`], {
          size: 11,
          gap: 13,
          color: [0.12, 0.13, 0.16],
        });
        const maxCount = Math.max(1, ...block.distribution.map((row) => row.count));
        for (const row of block.distribution.slice(0, 10)) {
          if (y < 52) {
            newPage();
          }
          const share = row.count / maxCount;
          const pct = block.totalAnswers > 0 ? Math.round((row.count / block.totalAnswers) * 100) : 0;
          const label = `${row.label.slice(0, 36)} · ${row.count} (${pct}%)`;
          page.drawText(label, { x, y, size: 9, font: regular, color: rgb(0.36, 0.4, 0.46) });
          page.drawRectangle({
            x: x + 220,
            y: y - 1,
            width: barTrackW,
            height: barH,
            color: rgb(0.91, 0.92, 0.94),
          });
          page.drawRectangle({
            x: x + 220,
            y: y - 1,
            width: Math.max(1, barTrackW * share),
            height: barH,
            color: rgb(0.22, 0.42, 0.88),
          });
          y -= 14;
        }
        y -= 6;
      }
    }

    if (y < 120) {
      newPage();
    }

    page.drawText("Тональность", { x, y, size: 14, font: bold, color: rgb(0.1, 0.11, 0.14) });
    y -= 18;
    drawLines(
      [
        analysis
          ? `Позитив: ${analysis.sentiment.positive}% • Нейтрально: ${analysis.sentiment.neutral}% • Негатив: ${analysis.sentiment.negative}%`
          : "ИИ-анализ не запускался.",
      ],
      { size: 11, gap: 15 },
    );
    y -= 6;

    page.drawText("Ключевые темы", { x, y, size: 14, font: bold, color: rgb(0.1, 0.11, 0.14) });
    y -= 18;
    if (analysis && analysis.themes.length > 0) {
      for (const [index, theme] of analysis.themes.slice(0, 6).entries()) {
        drawLines([`${index + 1}. ${theme.theme} (${theme.count} упоминаний, тональность: ${theme.sentiment})`], {
          size: 11,
          gap: 14,
        });
        for (const example of theme.examples.slice(0, 2)) {
          const wrapped = wrapText(`Пример: ${example}`, 86).map((lineText) => `   ${lineText}`);
          drawLines(wrapped, { size: 10, color: [0.36, 0.4, 0.46], gap: 13 });
        }
      }
    } else {
      drawLines(["Темы пока не определены."], { size: 11, color: [0.4, 0.44, 0.5] });
    }
    y -= 6;

    page.drawText("Ключевые инсайты", { x, y, size: 14, font: bold, color: rgb(0.1, 0.11, 0.14) });
    y -= 18;
    if (analysis && analysis.keyInsights.length > 0) {
      for (const [index, insight] of analysis.keyInsights.slice(0, 8).entries()) {
        drawLines(wrapText(`${index + 1}. ${insight}`, 92), { size: 11, gap: 14 });
      }
    } else {
      drawLines(["Ключевые инсайты отсутствуют."], { size: 11, color: [0.4, 0.44, 0.5] });
    }
    y -= 6;

    const diagnostics = params.diagnostics;
    if (diagnostics && (diagnostics.recommendations.length || diagnostics.hypotheses.length)) {
      if (y < 140) {
        newPage();
      }
      page.drawText("Стратегический блок", { x, y, size: 14, font: bold, color: rgb(0.1, 0.11, 0.14) });
      y -= 18;

      const drawBullets = (title: string, items: string[]) => {
        if (!items.length) return;
        if (y < 70) {
          newPage();
        }
        page.drawText(title, { x, y, size: 12, font: bold, color: rgb(0.14, 0.15, 0.18) });
        y -= 15;
        for (const item of items.slice(0, 6)) {
          if (y < 48) {
            newPage();
          }
          drawLines(wrapText(`• ${item}`, 92), { size: 10, gap: 12, color: [0.22, 0.24, 0.28] });
        }
        y -= 6;
      };

      drawBullets("Рекомендации", diagnostics.recommendations);
      drawBullets("Гипотезы", diagnostics.hypotheses);
      drawBullets("Риски", diagnostics.riskFactors);
      drawBullets("Метрики", diagnostics.metricsToWatch);
    }

    if (y < 100) {
      newPage();
    }

    page.drawText("Общий вывод", { x, y, size: 14, font: bold, color: rgb(0.1, 0.11, 0.14) });
    y -= 18;
    const summaryText = analysis?.summary?.trim() || "ИИ-анализ не запускался.";
    drawLines(wrapText(summaryText, 94), { size: 11, gap: 14 });

    page.drawLine({
      start: { x, y: 42 },
      end: { x: width - x, y: 42 },
      thickness: 1,
      color: rgb(0.88, 0.9, 0.93),
    });
    page.drawText("ПотокМнений", {
      x,
      y: 26,
      size: 9,
      font: regular,
      color: rgb(0.45, 0.49, 0.54),
    });

    return Buffer.from(await pdf.save());
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("PDF_GENERATION_FAILED");
  }
}
