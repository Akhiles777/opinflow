import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { AnalysisResult } from "@/lib/ai-analysis";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sentimentColor(sentiment: "positive" | "negative" | "neutral") {
  return sentiment === "positive" ? "#22C55E" : sentiment === "negative" ? "#EF4444" : "#94A3B8";
}

function buildReportHTML(params: {
  survey: { id: string; title: string; category?: string | null };
  analysis: AnalysisResult | null;
  stats: { totalResponses: number; completionRate: number; avgTimeMinutes: number; questionCount: number };
}) {
  const { survey, analysis, stats } = params;
  const generatedAt = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  const totalSentiment =
    (analysis?.sentiment.positive ?? 0) +
    (analysis?.sentiment.neutral ?? 0) +
    (analysis?.sentiment.negative ?? 0) || 1;
  const positiveWidth = `${Math.round(((analysis?.sentiment.positive ?? 0) / totalSentiment) * 100)}%`;
  const neutralWidth = `${Math.round(((analysis?.sentiment.neutral ?? 0) / totalSentiment) * 100)}%`;
  const negativeWidth = `${Math.round(((analysis?.sentiment.negative ?? 0) / totalSentiment) * 100)}%`;

  return `<!doctype html>
  <html lang="ru">
    <head>
      <meta charset="utf-8" />
      <title>Отчёт — ${escapeHtml(survey.title)}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: 'Inter', sans-serif;
          color: #111827;
          background: #F5F7FB;
          padding: 24px;
        }
        .page { background: white; border-radius: 24px; overflow: hidden; }
        .header {
          background: #0A0A0F;
          color: white;
          padding: 32px;
        }
        .brand { font-size: 12px; letter-spacing: .24em; text-transform: uppercase; opacity: .7; }
        .title { margin: 16px 0 8px; font-size: 30px; font-weight: 800; }
        .subtitle { margin: 0; font-size: 14px; opacity: .75; }
        .section { padding: 28px 32px; border-top: 1px solid #E5E7EB; }
        .section h2 { margin: 0 0 18px; font-size: 20px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .stat { border: 1px solid #E5E7EB; border-radius: 18px; padding: 16px; background: #FAFBFC; }
        .stat-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: .12em; }
        .stat-value { margin-top: 10px; font-size: 28px; font-weight: 800; color: #111827; }
        .bar { display: flex; overflow: hidden; border-radius: 999px; height: 16px; background: #E5E7EB; }
        .legend { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; font-size: 13px; color: #4B5563; }
        .dot { display: inline-block; width: 10px; height: 10px; border-radius: 999px; margin-right: 8px; }
        .themes { display: grid; gap: 12px; }
        .theme { border: 1px solid #E5E7EB; border-radius: 18px; padding: 16px; background: #FAFBFC; }
        .theme-head { display: flex; justify-content: space-between; gap: 16px; align-items: center; }
        .theme-title { font-weight: 700; font-size: 16px; }
        .sentiment-tag { border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 700; color: white; }
        .examples { margin-top: 12px; padding-left: 18px; color: #4B5563; }
        .examples li { margin-bottom: 6px; }
        .insight { border-left: 3px solid #6366F1; padding: 10px 0 10px 14px; margin-bottom: 12px; background: #F8FAFC; }
        .summary { padding: 18px; border-radius: 18px; background: #F8FAFC; border: 1px solid #E5E7EB; line-height: 1.7; color: #374151; }
        .footer { padding: 24px 32px 32px; color: #6B7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="page">
        <section class="header">
          <div class="brand">ПотокМнений</div>
          <div class="title">${escapeHtml(survey.title)}</div>
          <p class="subtitle">${escapeHtml(survey.category || "Маркетинговое исследование")} · Отчёт сформирован ${escapeHtml(generatedAt)}</p>
        </section>

        <section class="section">
          <h2>Ключевые показатели</h2>
          <div class="stats">
            <div class="stat"><div class="stat-label">Ответов</div><div class="stat-value">${stats.totalResponses}</div></div>
            <div class="stat"><div class="stat-label">Завершили</div><div class="stat-value">${stats.completionRate}%</div></div>
            <div class="stat"><div class="stat-label">Среднее время</div><div class="stat-value">${stats.avgTimeMinutes} мин</div></div>
            <div class="stat"><div class="stat-label">Вопросов</div><div class="stat-value">${stats.questionCount}</div></div>
          </div>
        </section>

        <section class="section">
          <h2>Тональность</h2>
          ${
            analysis
              ? `<div class="bar">
                   <div style="width:${positiveWidth}; background:#22C55E;"></div>
                   <div style="width:${neutralWidth}; background:#94A3B8;"></div>
                   <div style="width:${negativeWidth}; background:#EF4444;"></div>
                 </div>
                 <div class="legend">
                   <span><span class="dot" style="background:#22C55E"></span>Позитивно: ${analysis.sentiment.positive}%</span>
                   <span><span class="dot" style="background:#94A3B8"></span>Нейтрально: ${analysis.sentiment.neutral}%</span>
                   <span><span class="dot" style="background:#EF4444"></span>Негативно: ${analysis.sentiment.negative}%</span>
                 </div>`
              : `<div class="summary">ИИ-анализ не запускался.</div>`
          }
        </section>

        <section class="section">
          <h2>Ключевые темы</h2>
          ${
            analysis && analysis.themes.length
              ? `<div class="themes">${analysis.themes
                  .map(
                    (theme) => `<div class="theme">
                      <div class="theme-head">
                        <div class="theme-title">${escapeHtml(theme.theme)} · ${theme.count}</div>
                        <div class="sentiment-tag" style="background:${sentimentColor(theme.sentiment)}">${escapeHtml(theme.sentiment)}</div>
                      </div>
                      <ul class="examples">
                        ${theme.examples.map((example) => `<li>${escapeHtml(example)}</li>`).join("")}
                      </ul>
                    </div>`,
                  )
                  .join("")}</div>`
              : `<div class="summary">Темы пока не определены.</div>`
          }
        </section>

        <section class="section">
          <h2>Ключевые инсайты</h2>
          ${
            analysis && analysis.keyInsights.length
              ? analysis.keyInsights
                  .map((item) => `<div class="insight">${escapeHtml(item)}</div>`)
                  .join("")
              : `<div class="summary">ИИ ещё не сформировал выводы.</div>`
          }
        </section>

        <section class="section">
          <h2>Общий вывод</h2>
          <div class="summary">${escapeHtml(analysis?.summary || "ИИ-анализ не запускался.")}</div>
        </section>

        <footer class="footer">ПотокМнений · ${escapeHtml(generatedAt)}</footer>
      </div>
    </body>
  </html>`;
}

export async function generateSurveyPDF(params: {
  survey: { id: string; title: string; category?: string | null };
  analysis: AnalysisResult | null;
  stats: { totalResponses: number; completionRate: number; avgTimeMinutes: number; questionCount: number };
}): Promise<Buffer> {
  try {
    const pdf = await PDFDocument.create();
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const marginX = 42;
    let cursorY = height - 40;

    const title = `Отчёт: ${params.survey.title}`;
    page.drawText(title.slice(0, 90), {
      x: marginX,
      y: cursorY,
      size: 20,
      font: fontBold,
      color: rgb(0.06, 0.07, 0.1),
    });
    cursorY -= 28;

    const subtitle = `${params.survey.category || "Маркетинговое исследование"} | ${new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}`;
    page.drawText(subtitle.slice(0, 110), {
      x: marginX,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: rgb(0.35, 0.4, 0.46),
    });
    cursorY -= 30;

    const statLines = [
      `Ответов: ${params.stats.totalResponses}`,
      `Завершили: ${params.stats.completionRate}%`,
      `Среднее время: ${params.stats.avgTimeMinutes} мин`,
      `Вопросов: ${params.stats.questionCount}`,
    ];

    page.drawText("Ключевые показатели", { x: marginX, y: cursorY, size: 13, font: fontBold });
    cursorY -= 18;
    for (const line of statLines) {
      page.drawText(line, { x: marginX, y: cursorY, size: 11, font: fontRegular });
      cursorY -= 15;
    }
    cursorY -= 8;

    const analysis = params.analysis;
    page.drawText("ИИ-аналитика", { x: marginX, y: cursorY, size: 13, font: fontBold });
    cursorY -= 18;

    if (!analysis) {
      page.drawText("ИИ-анализ не запускался.", {
        x: marginX,
        y: cursorY,
        size: 11,
        font: fontRegular,
        color: rgb(0.35, 0.4, 0.46),
      });
      cursorY -= 18;
    } else {
      page.drawText(
        `Тональность: +${analysis.sentiment.positive}% / ~${analysis.sentiment.neutral}% / -${analysis.sentiment.negative}%`,
        { x: marginX, y: cursorY, size: 11, font: fontRegular },
      );
      cursorY -= 20;

      page.drawText("Ключевые инсайты:", { x: marginX, y: cursorY, size: 12, font: fontBold });
      cursorY -= 16;
      for (const [index, insight] of analysis.keyInsights.slice(0, 6).entries()) {
        const line = `${index + 1}. ${insight}`.slice(0, 115);
        page.drawText(line, { x: marginX, y: cursorY, size: 10, font: fontRegular });
        cursorY -= 14;
      }
      cursorY -= 4;

      page.drawText("Топ-темы:", { x: marginX, y: cursorY, size: 12, font: fontBold });
      cursorY -= 16;
      for (const theme of analysis.themes.slice(0, 6)) {
        const line = `${theme.theme} (${theme.count}) [${theme.sentiment}]`.slice(0, 115);
        page.drawText(line, { x: marginX, y: cursorY, size: 10, font: fontRegular });
        cursorY -= 14;
      }
      cursorY -= 6;

      page.drawText("Общий вывод:", { x: marginX, y: cursorY, size: 12, font: fontBold });
      cursorY -= 16;
      const summary = (analysis.summary || "ИИ ещё не сформировал вывод.").replace(/\s+/g, " ");
      const summaryChunks = summary.match(/.{1,115}(\s|$)/g) || [summary.slice(0, 115)];
      for (const chunk of summaryChunks.slice(0, 8)) {
        page.drawText(chunk.trim(), { x: marginX, y: cursorY, size: 10, font: fontRegular });
        cursorY -= 14;
      }
    }

    page.drawLine({
      start: { x: marginX, y: 36 },
      end: { x: width - marginX, y: 36 },
      thickness: 1,
      color: rgb(0.9, 0.91, 0.92),
    });
    page.drawText("ПотокМнений", {
      x: marginX,
      y: 22,
      size: 9,
      font: fontRegular,
      color: rgb(0.45, 0.49, 0.54),
    });

    const bytes = await pdf.save();
    return Buffer.from(bytes);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("PDF_GENERATION_FAILED");
  }
}
