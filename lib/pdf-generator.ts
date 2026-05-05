import { uploadSurveyReport } from "@/lib/storage";
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
}) {
  const puppeteer = await import("puppeteer-core");
  const chromium = (await import("@sparticuz/chromium")).default;

  let browser: Awaited<ReturnType<typeof puppeteer.default.launch>> | null = null;

  try {
    browser = await puppeteer.default.launch({
      args: chromium.args,
      defaultViewport: { width: 1440, height: 1024, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(buildReportHTML(params), { waitUntil: "networkidle0" });
    const pdfBuffer = Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20mm",
          bottom: "20mm",
          left: "15mm",
          right: "15mm",
        },
      }),
    );

    return await uploadSurveyReport(params.survey.id, pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
