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
  const filledProgressSegments = Math.max(1, Math.min(10, Math.round(((currentIndex + 1) / Math.max(visibleQuestions.length, 1)) * 10)));

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
      router.push(`/survey/${survey.id}/complete?${params.toString()}`);
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

  if (stage === "INIT") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-site-bg px-6 py-12 text-site-body">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-site-border border-t-brand" />
          <p className="text-base text-site-muted">Загрузка опроса...</p>
        </div>
      </div>
    );
  }

  if (stage === "ERROR") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-site-bg px-6 py-12 text-site-body">
        <div className="w-full max-w-xl rounded-3xl border border-site-border bg-site-card p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15 text-3xl text-red-400">
            ⚠️
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold text-site-heading">Не удалось открыть опрос</h1>
          <p className="mt-3 text-base leading-relaxed text-site-muted">{error ?? "Попробуйте открыть другой опрос или вернитесь к ленте."}</p>
          <Link
            href="/surveys"
            className="mt-7 inline-flex items-center justify-center rounded-2xl border border-site-border bg-site-section px-6 py-3 text-sm font-semibold text-site-heading transition-colors hover:bg-site-card"
          >
            Вернуться к ленте
          </Link>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-site-bg px-6 py-12 text-site-body">
        <div className="w-full max-w-xl rounded-3xl border border-site-border bg-site-card p-8 text-center shadow-2xl">
          <h1 className="font-display text-3xl font-bold text-site-heading">Вопросы не найдены</h1>
          <p className="mt-3 text-base text-site-muted">У этого опроса пока нет доступных вопросов для прохождения.</p>
          <Link href="/surveys" className="mt-7 inline-flex rounded-2xl border border-site-border bg-site-section px-6 py-3 text-sm font-semibold text-site-heading transition-colors hover:bg-site-card">
            Вернуться к ленте
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-site-bg text-site-body">
      <div className="fixed inset-x-0 top-14 z-40 grid h-0.5 grid-cols-10 gap-px bg-site-border/40">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={`survey-progress-${index}`}
            className={index < filledProgressSegments ? "bg-brand" : "bg-site-border/40"}
          />
        ))}
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-4xl flex-col px-6 pb-12 pt-10 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-site-muted">ПотокМнений</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-site-heading lg:text-3xl">{survey.title}</h1>
          </div>
          <div className="rounded-full border border-site-border bg-site-card px-4 py-2 text-sm font-semibold text-site-muted">
            {currentIndex + 1} / {visibleQuestions.length}
          </div>
        </div>

        <div className="mt-10 flex-1">
          {currentQuestion.mediaUrl ? (
            <img
              src={currentQuestion.mediaUrl}
              alt="Иллюстрация к вопросу"
              className="mb-8 h-auto w-full rounded-2xl border border-site-border object-cover"
            />
          ) : null}

          <div className="max-w-3xl">
            <h2 className="font-display text-2xl font-bold text-site-heading lg:text-3xl">{currentQuestion.title}</h2>
            {currentQuestion.description ? (
              <p className="mt-3 text-base leading-relaxed text-site-muted">{currentQuestion.description}</p>
            ) : null}

            <div className="mt-8">
              <QuestionRenderer
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                onChange={handleChange}
              />
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-500 dark:text-red-400">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-site-border pt-6">
          <button
            type="button"
            onClick={handlePrev}
            className={[
              "rounded-2xl border border-site-border px-5 py-3 text-sm font-semibold transition-colors",
              currentIndex === 0 ? "pointer-events-none opacity-0" : "bg-site-card text-site-heading hover:bg-site-section",
            ].join(" ")}
          >
            ← Назад
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={stage === "SUBMITTING" || isPending}
            className="rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-mid disabled:cursor-not-allowed disabled:opacity-60"
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
  );
}
