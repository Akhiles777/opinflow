"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeSurveyAction, startSurveyAction } from "@/actions/surveys";
import QuestionRenderer from "@/components/survey-player/QuestionRenderer";
import type { LogicRule, Question } from "@/types/survey";

type PlayerSurvey = {
  id: string;
  title: string;
  reward: number | null;
  questions: Question[];
};

type Props = {
  survey: PlayerSurvey;
  existingSessionId: string | null;
};

type Stage = "INIT" | "PLAYING" | "SUBMITTING" | "ERROR";

function evaluateRule(rule: LogicRule, answer: unknown) {
  if (rule.operator === "equals") {
    return String(answer ?? "") === rule.value;
  }

  if (rule.operator === "not_equals") {
    return String(answer ?? "") !== rule.value;
  }

  if (Array.isArray(answer)) {
    return answer.includes(rule.value);
  }

  return String(answer ?? "").includes(rule.value);
}

function getVisibleQuestions(questions: Question[], answers: Record<string, unknown>) {
  return questions.filter((question) => {
    if (!question.logic.length) return true;

    return question.logic.every((rule) => {
      const matched = evaluateRule(rule, answers[rule.ifQuestionId]);
      if (rule.action === "show") return matched;
      return !matched;
    });
  });
}

function getDeviceId() {
  const storageKey = "opinflow_did";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const seed = [
    navigator.userAgent,
    window.screen.width,
    window.screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  const id = btoa(seed).replace(/[^a-zA-Z0-9]/g, "").slice(0, 40) || crypto.randomUUID().replace(/-/g, "").slice(0, 40);
  window.localStorage.setItem(storageKey, id);
  return id;
}

function getProgressStorageKey(surveyId: string) {
  return `opinflow-survey-progress-${surveyId}`;
}

function hasAnswer(question: Question, value: unknown) {
  if (!question.required) return true;

  if (question.type === "MULTIPLE_CHOICE" || question.type === "RANKING") {
    return Array.isArray(value) && value.length > 0;
  }

  if (question.type === "MATRIX") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return question.matrixRows.every((row) => Boolean((value as Record<string, unknown>)[row]));
  }

  if (question.type === "OPEN_TEXT") {
    return typeof value === "string" && value.trim().length > 0;
  }

  return value !== undefined && value !== null && value !== "";
}

export default function SurveyPlayer({ survey, existingSessionId }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("INIT");
  const [sessionId, setSessionId] = useState<string | null>(existingSessionId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const startedAtRef = useRef(Date.now());

  const visibleQuestions = useMemo(() => getVisibleQuestions(survey.questions, answers), [survey.questions, answers]);
  const currentQuestion = visibleQuestions[currentIndex] ?? null;

  // Прогресс-бар: количество заполненных сегментов (до 40 макс, по 1 на вопрос)
  const totalSegments = Math.min(visibleQuestions.length, 40);
  const filledSegments = Math.min(currentIndex + 1, totalSegments);

  useEffect(() => {
    const saved = window.localStorage.getItem(getProgressStorageKey(survey.id));
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        sessionId?: string;
        currentIndex?: number;
        answers?: Record<string, unknown>;
        startedAt?: number;
      };

      if (parsed.sessionId && existingSessionId && parsed.sessionId !== existingSessionId) {
        return;
      }

      if (parsed.answers && typeof parsed.answers === "object") {
        setAnswers(parsed.answers);
      }
      if (typeof parsed.currentIndex === "number") {
        setCurrentIndex(Math.max(parsed.currentIndex, 0));
      }
      if (typeof parsed.startedAt === "number" && Number.isFinite(parsed.startedAt)) {
        startedAtRef.current = parsed.startedAt;
      }
    } catch {
      window.localStorage.removeItem(getProgressStorageKey(survey.id));
    }
  }, [existingSessionId, survey.id]);

  useEffect(() => {
    if (existingSessionId) {
      setSessionId(existingSessionId);
      setStage("PLAYING");
      return;
    }

    let cancelled = false;

    startTransition(async () => {
      const result = await startSurveyAction(survey.id);
      if (cancelled) return;

      if (result.error || !result.success) {
        setStage("ERROR");
        setError(result.error ?? "Не удалось начать опрос");
        return;
      }

      setSessionId(result.sessionId);
      setStage("PLAYING");
    });

    return () => {
      cancelled = true;
    };
  }, [existingSessionId, survey.id]);

  useEffect(() => {
    if (currentIndex > 0 && currentIndex >= visibleQuestions.length) {
      setCurrentIndex(Math.max(visibleQuestions.length - 1, 0));
    }
  }, [currentIndex, visibleQuestions.length]);

  useEffect(() => {
    if (!sessionId || stage !== "PLAYING") {
      return;
    }

    window.localStorage.setItem(
      getProgressStorageKey(survey.id),
      JSON.stringify({
        sessionId,
        currentIndex,
        answers,
        startedAt: startedAtRef.current,
      }),
    );
  }, [answers, currentIndex, sessionId, stage, survey.id]);

  function handleChange(value: unknown) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    setError(null);
  }

  function handlePrev() {
    setError(null);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit() {
    if (!currentQuestion || !sessionId) return;

    setStage("SUBMITTING");
    setError(null);

    startTransition(async () => {
      const result = await completeSurveyAction({
        surveyId: survey.id,
        sessionId,
        answers,
        timeSpent: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
        deviceId: getDeviceId(),
      });

      if (!result.success) {
        setStage("ERROR");
        setError(result.error ?? "Не удалось завершить опрос");
        return;
      }

      window.localStorage.removeItem(getProgressStorageKey(survey.id));

      const params = new URLSearchParams({
        rewarded: String(result.rewarded),
        amount: String(result.amount),
      });
      router.push(`/respondent/survey/${survey.id}/complete?${params.toString()}`);
    });
  }

  function handleNext() {
    if (!currentQuestion) return;

    const answer = answers[currentQuestion.id];
    if (!hasAnswer(currentQuestion, answer)) {
      setError("Пожалуйста, ответьте на этот вопрос");
      return;
    }

    if (currentIndex === visibleQuestions.length - 1) {
      handleSubmit();
      return;
    }

    setError(null);
    setCurrentIndex((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── INIT (загрузка) ──────────────────────────────────────────────────────
  if (stage === "INIT") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-dash-border border-t-brand" />
          <p className="text-base text-dash-muted">Загрузка опроса...</p>
        </div>
      </div>
    );
  }

  // ── ERROR ────────────────────────────────────────────────────────────────
  if (stage === "ERROR") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-dash-border bg-dash-card p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-3xl text-red-400">
            ⚠️
          </div>
          <h1 className="mt-5 text-2xl font-bold text-dash-heading lg:text-3xl">Не удалось открыть опрос</h1>
          <p className="mt-3 text-base leading-relaxed text-dash-muted">
            {error ?? "Попробуйте открыть другой опрос или вернитесь к ленте."}
          </p>
          <Link
            href="/respondent/feed"
            className="mt-7 inline-flex items-center justify-center rounded-xl border border-dash-border bg-dash-bg px-6 py-3 text-sm font-semibold text-dash-heading transition-colors hover:bg-dash-card"
          >
            Вернуться к ленте
          </Link>
        </div>
      </div>
    );
  }

  // ── Нет вопросов ─────────────────────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl rounded-2xl border border-dash-border bg-dash-card p-8 text-center">
          <h1 className="text-2xl font-bold text-dash-heading lg:text-3xl">Вопросы не найдены</h1>
          <p className="mt-3 text-base text-dash-muted">
            У этого опроса пока нет доступных вопросов для прохождения.
          </p>
          <Link
            href="/respondent/feed"
            className="mt-7 inline-flex rounded-xl border border-dash-border bg-dash-bg px-6 py-3 text-sm font-semibold text-dash-heading transition-colors hover:bg-dash-card"
          >
            Вернуться к ленте
          </Link>
        </div>
      </div>
    );
  }

  // ── PLAYING / SUBMITTING ──────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-dash-bg px-6 pb-10 pt-8 lg:px-8 lg:pb-12 lg:pt-9">
      <div className="mx-auto max-w-3xl">
        {/* Заголовок страницы */}
        <div>
          <p className="text-sm text-dash-muted">ПотокМнений</p>
          <h1 className="mt-1 text-2xl font-bold text-dash-heading lg:text-3xl">{survey.title}</h1>
        </div>

        {/* Карточка вопроса */}
        <div className="mt-6 rounded-2xl border border-dash-border bg-dash-card p-8">
          {/* Вопрос */}
          <h2 className="text-xl font-bold text-dash-heading lg:text-2xl">{currentQuestion.title}</h2>
          {currentQuestion.description ? (
            <p className="mt-3 text-base leading-relaxed text-dash-muted">{currentQuestion.description}</p>
          ) : null}

          {/* Счётчик + прогресс-бар */}
          <p className="mt-4 text-sm text-dash-muted">
            {currentIndex + 1}/{visibleQuestions.length} ответов
          </p>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: totalSegments }, (_, i) => (
              <div
                key={`seg-${i}`}
                className={[
                  "h-1 flex-1 rounded-full",
                  i < filledSegments ? "bg-brand" : "bg-dash-border",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Медиа */}
          {currentQuestion.mediaUrl ? (
            <img
              src={currentQuestion.mediaUrl}
              alt="Иллюстрация к вопросу"
              className="mt-6 h-auto w-full rounded-xl object-cover"
            />
          ) : null}

          {/* Ответы */}
          <div className="mt-8">
            <QuestionRenderer
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={handleChange}
            />
          </div>

          {/* Ошибка */}
          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : null}

          {/* Навигация */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className={[
                "rounded-xl border border-dash-border px-6 py-3 text-sm font-semibold text-dash-heading transition-colors hover:bg-dash-bg",
                currentIndex === 0 ? "pointer-events-none opacity-0" : "",
              ].join(" ")}
            >
              ← Назад
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={stage === "SUBMITTING" || isPending}
              className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:cursor-not-allowed disabled:opacity-60"
            >
              {stage === "SUBMITTING" || isPending
                ? "Сохраняем..."
                : currentIndex === visibleQuestions.length - 1
                  ? "Завершить опрос"
                  : "Далее →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
