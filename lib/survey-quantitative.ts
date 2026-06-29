import type { QuestionType, SurveyQuestion } from "@prisma/client";
import { mapSurveyQuestion } from "@/lib/survey-mappers";

export type QuantQuestionBlock = {
  id: string;
  title: string;
  type: QuestionType;
  totalAnswers: number;
  distribution: { label: string; count: number }[];
  openAnswers?: string[];
  rankMaxScore?: number;
};

type RawQuestionForQuant = Pick<
  SurveyQuestion,
  "id" | "type" | "title" | "description" | "required" | "mediaUrl" | "options" | "settings" | "logic"
> & {
  answers: Array<{ value: unknown }>;
};

function normalizeAnswerValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function incrementCount(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export function buildQuantitativeBlocks(questions: RawQuestionForQuant[]): QuantQuestionBlock[] {
  const blocks: QuantQuestionBlock[] = [];

  for (const raw of questions) {
    const question = mapSurveyQuestion(raw);
    const totalAnswers = raw.answers.length;

    if (question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") {
      const counts: Record<string, number> = {};
      for (const option of question.options) {
        counts[option] = 0;
      }

      for (const answer of raw.answers) {
        if (Array.isArray(answer.value)) {
          for (const item of answer.value) {
            if (typeof item === "string") incrementCount(counts, item);
          }
          continue;
        }

        const normalized = normalizeAnswerValue(answer.value);
        if (normalized) incrementCount(counts, normalized);
      }

      blocks.push({
        id: raw.id,
        title: question.title,
        type: raw.type,
        totalAnswers,
        distribution: Object.entries(counts)
          .map(([label, count]) => ({ label, count }))
          .sort((left, right) => right.count - left.count),
      });
      continue;
    }

    if (question.type === "RANKING") {
      const numOptions = question.options.length;
      const scores: Record<string, number> = {};
      for (const option of question.options) {
        scores[option] = 0;
      }

      for (const answer of raw.answers) {
        if (!Array.isArray(answer.value)) continue;
        const ranked = answer.value.filter((item): item is string => typeof item === "string");
        ranked.forEach((item, index) => {
          if (item in scores) {
            // 1st place = numOptions-1 pts, last place = 0 pts
            scores[item] += numOptions - 1 - index;
          }
        });
      }

      const maxScore = Math.max(1, (numOptions - 1) * totalAnswers);

      blocks.push({
        id: raw.id,
        title: question.title,
        type: raw.type,
        totalAnswers,
        rankMaxScore: maxScore,
        distribution: Object.entries(scores)
          .map(([label, count]) => ({ label, count }))
          .sort((left, right) => right.count - left.count),
      });
      continue;
    }

    if (question.type === "OPEN_TEXT") {
      const openAnswers: string[] = [];
      for (const answer of raw.answers) {
        const text = normalizeAnswerValue(answer.value);
        if (text?.trim()) openAnswers.push(text.trim());
      }
      if (openAnswers.length > 0 || totalAnswers > 0) {
        blocks.push({
          id: raw.id,
          title: question.title,
          type: raw.type,
          totalAnswers,
          distribution: [],
          openAnswers,
        });
      }
      continue;
    }

    if (question.type === "SCALE") {
      const min = Number(question.settings.min ?? 1);
      const max = Number(question.settings.max ?? 10);
      const counts: Record<string, number> = {};

      for (let index = min; index <= max; index += 1) {
        counts[String(index)] = 0;
      }

      for (const answer of raw.answers) {
        const normalized = normalizeAnswerValue(answer.value);
        if (normalized) incrementCount(counts, normalized);
      }

      blocks.push({
        id: raw.id,
        title: question.title,
        type: raw.type,
        totalAnswers,
        distribution: Object.entries(counts)
          .map(([label, count]) => ({ label, count }))
          .sort((left, right) => Number(right.label) - Number(left.label)),
      });
      continue;
    }

    if (question.type === "MATRIX") {
      const matrix: Record<string, Record<string, number>> = {};
      for (const row of question.matrixRows) {
        matrix[row] = {};
        for (const col of question.matrixCols) {
          matrix[row][col] = 0;
        }
      }

      for (const answer of raw.answers) {
        if (!answer.value || typeof answer.value !== "object" || Array.isArray(answer.value)) continue;

        for (const row of question.matrixRows) {
          const selected = (answer.value as Record<string, unknown>)[row];
          if (typeof selected === "string") incrementCount(matrix[row], selected);
        }
      }

      const distribution: { label: string; count: number }[] = [];
      for (const row of question.matrixRows) {
        for (const col of question.matrixCols) {
          const count = matrix[row][col];
          distribution.push({ label: `${row} → ${col}`, count });
        }
      }

      distribution.sort((left, right) => right.count - left.count);

      blocks.push({
        id: raw.id,
        title: question.title,
        type: raw.type,
        totalAnswers,
        distribution,
      });
    }
  }

  return blocks;
}

export function quantitativeSummaryForPrompt(blocks: QuantQuestionBlock[], maxLength = 12_000): string {
  if (!blocks.length) return "";

  const text = blocks
    .map((block) => {
      if (block.type === "OPEN_TEXT") {
        const answers = (block.openAnswers ?? []).slice(0, 30).map((a) => `  • ${a}`).join("\n");
        return `Вопрос [OPEN_TEXT]: «${block.title}»\nОтветов: ${block.totalAnswers}\n${answers}`;
      }

      const lines = block.distribution
        .slice(0, 20)
        .map((row) => {
          if (block.type === "RANKING" && block.rankMaxScore) {
            const pct = Math.round((row.count / block.rankMaxScore) * 100);
            return `  • ${row.label}: score ${row.count} (${pct}% от макс.)`;
          }
          const pct = block.totalAnswers > 0 ? Math.round((row.count / block.totalAnswers) * 100) : 0;
          return `  • ${row.label}: ${row.count} (${pct}%)`;
        })
        .join("\n");
      return `Вопрос [${block.type}]: «${block.title}»\nОтветов: ${block.totalAnswers}\n${lines}`;
    })
    .join("\n\n");

  return text.slice(0, maxLength);
}
