import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { AnalysisResult } from "@/lib/ai-analysis";

const typedPdfMake = pdfMake as unknown as {
  vfs: Record<string, string>;
  createPdf: (docDefinition: unknown) => { getBuffer: (callback: (buffer: Uint8Array) => void) => void };
};
const pdfVfs = (pdfFonts as unknown as { pdfMake?: { vfs?: Record<string, string> }; vfs?: Record<string, string> });
typedPdfMake.vfs = pdfVfs.pdfMake?.vfs || pdfVfs.vfs || {};

export async function generateSurveyPDF(params: {
  survey: { id: string; title: string; category?: string | null };
  analysis: AnalysisResult | null;
  stats: { totalResponses: number; completionRate: number; avgTimeMinutes: number; questionCount: number };
}): Promise<Buffer> {
  try {
    const analysis = params.analysis;
    const generatedAt = new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());

    const themesSection =
      analysis && analysis.themes.length > 0
        ? analysis.themes.slice(0, 8).flatMap((theme, index) => [
            {
              text: `${index + 1}. ${theme.theme} (${theme.count} упоминаний, тональность: ${theme.sentiment})`,
              margin: [0, index === 0 ? 4 : 8, 0, 2] as [number, number, number, number],
            },
            ...(theme.examples?.slice(0, 2).map((example) => ({
              text: `Пример: ${example}`,
              margin: [10, 0, 0, 2] as [number, number, number, number],
              color: "#4B5563",
            })) || []),
          ])
        : [{ text: "Темы пока не определены.", color: "#6B7280", margin: [0, 4, 0, 0] as [number, number, number, number] }];

    const insightsSection =
      analysis && analysis.keyInsights.length > 0
        ? analysis.keyInsights.slice(0, 8).map((item, index) => ({
            text: `${index + 1}. ${item}`,
            margin: [0, index === 0 ? 4 : 6, 0, 0] as [number, number, number, number],
          }))
        : [{ text: "Ключевые инсайты отсутствуют.", color: "#6B7280", margin: [0, 4, 0, 0] as [number, number, number, number] }];

    const summaryText = analysis?.summary?.trim() || "ИИ-анализ не запускался.";

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [36, 36, 36, 36],
      content: [
        { text: params.survey.title || "Отчет по опросу", fontSize: 20, bold: true, color: "#111827" },
        {
          text: `${params.survey.category || "Маркетинговое исследование"} • Сформирован ${generatedAt}`,
          margin: [0, 4, 0, 14],
          color: "#6B7280",
        },
        { text: "Ключевые показатели", fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
        { text: `Ответов: ${params.stats.totalResponses}` },
        { text: `Завершили: ${params.stats.completionRate}%` },
        { text: `Среднее время: ${params.stats.avgTimeMinutes} мин` },
        { text: `Вопросов: ${params.stats.questionCount}`, margin: [0, 0, 0, 12] },

        { text: "Тональность", fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
        {
          text: analysis
            ? `Позитив: ${analysis.sentiment.positive}% • Нейтрально: ${analysis.sentiment.neutral}% • Негатив: ${analysis.sentiment.negative}%`
            : "ИИ-анализ не запускался.",
          margin: [0, 0, 0, 12],
        },

        { text: "Ключевые темы", fontSize: 14, bold: true, margin: [0, 0, 0, 2] },
        ...themesSection,
        { text: "", margin: [0, 6, 0, 0] },
        { text: "Ключевые инсайты", fontSize: 14, bold: true, margin: [0, 0, 0, 2] },
        ...insightsSection,
        { text: "", margin: [0, 6, 0, 0] },
        { text: "Общий вывод", fontSize: 14, bold: true, margin: [0, 0, 0, 6] },
        { text: summaryText, lineHeight: 1.3, color: "#1F2937" },
      ],
      defaultStyle: {
        font: "Roboto",
        fontSize: 11,
      },
      info: {
        title: `Отчет - ${params.survey.title || params.survey.id}`,
        author: "ПотокМнений",
      },
    };

    const pdf = typedPdfMake.createPdf(docDefinition);
    const buffer = await new Promise<Buffer>((resolve) => {
      pdf.getBuffer((data) => resolve(Buffer.from(data)));
    });
    return buffer;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("PDF_GENERATION_FAILED");
  }
}
