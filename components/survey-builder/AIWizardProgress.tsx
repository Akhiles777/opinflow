"use client";

export default function AIWizardProgress({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Генерация" },
    { n: 2, label: "Вопросы" },
    { n: 3, label: "Настройки" },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                s.n < step
                  ? "bg-brand text-white"
                  : s.n === step
                  ? "bg-brand text-white ring-2 ring-brand/30"
                  : "bg-site-border text-site-muted"
              }`}
            >
              {s.n < step ? "✓" : s.n}
            </span>
            <span className={`text-xs font-medium ${s.n === step ? "text-site-heading" : "text-site-muted"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-8 ${s.n < step ? "bg-brand" : "bg-site-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
