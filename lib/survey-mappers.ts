import type { SurveyStatus, SurveyQuestion } from "@prisma/client";
import type { LogicRule, Question } from "@/types/survey";

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toLogicRules(value: unknown): LogicRule[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is LogicRule => {
    if (!item || typeof item !== "object") return false;
    const rule = item as Record<string, unknown>;
    return (
      typeof rule.ifQuestionId === "string" &&
      (rule.operator === "equals" || rule.operator === "not_equals" || rule.operator === "contains") &&
      typeof rule.value === "string" &&
      (rule.action === "show" || rule.action === "hide")
    );
  });
}

export function mapSurveyQuestion(question: Pick<SurveyQuestion, "id" | "type" | "title" | "description" | "required" | "mediaUrl" | "options" | "settings" | "logic">): Question {
  const rawOptions = question.options;
  const isMatrixOptions = rawOptions && typeof rawOptions === "object" && !Array.isArray(rawOptions);
  const matrixRows = isMatrixOptions ? toStringArray((rawOptions as Record<string, unknown>).rows) : [];
  const matrixCols = isMatrixOptions ? toStringArray((rawOptions as Record<string, unknown>).cols) : [];

  return {
    id: question.id,
    type: question.type,
    title: question.title,
    description: question.description ?? "",
    required: question.required,
    mediaUrl: question.mediaUrl ?? null,
    options: Array.isArray(rawOptions) ? toStringArray(rawOptions) : [],
    matrixRows,
    matrixCols,
    settings: question.settings && typeof question.settings === "object" && !Array.isArray(question.settings)
      ? (question.settings as Record<string, unknown>)
      : {},
    logic: toLogicRules(question.logic),
  };
}

export function getSurveyStatusMeta(status: SurveyStatus) {
  switch (status) {
    case "ACTIVE":
      return { label: "Активен", variant: "active" as const };
    case "PENDING_MODERATION":
      return { label: "На модерации", variant: "moderation" as const };
    case "PAUSED":
      return { label: "Пауза", variant: "pending" as const };
    case "REJECTED":
      return { label: "Отклонён", variant: "rejected" as const };
    case "COMPLETED":
      return { label: "Завершён", variant: "completed" as const };
    case "DRAFT":
    default:
      return { label: "Черновик", variant: "draft" as const };
  }
}
