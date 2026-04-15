"use client";

import { useState } from "react";

type Row = {
  date: string;
  type: string;
  user: string;
  amount: number;
  fee: number;
  status: { t: string };
};

type Props = {
  rows: Row[];
};

function escapeCsv(value: string | number) {
  const stringValue = String(value ?? "");
  if (/[",;\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
}

export default function AdminFinanceExportButton({ rows }: Props) {
  const [isExporting, setIsExporting] = useState(false);

  function handleExport() {
    setIsExporting(true);

    try {
      const header = ["Дата", "Тип", "Пользователь", "Сумма", "Комиссия", "Статус"];
      const body = rows.map((row) => [
        row.date,
        row.type,
        row.user,
        row.amount,
        row.fee,
        row.status.t,
      ]);

      const csv = [header, ...body]
        .map((line) => line.map(escapeCsv).join(";"))
        .join("\n");

      const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `admin-finance-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting || rows.length === 0}
      className="rounded-xl border border-dash-border bg-dash-bg px-4 py-2 text-[15px] font-semibold text-dash-heading transition-colors hover:bg-dash-card disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isExporting ? "Готовим CSV..." : "Экспорт CSV"}
    </button>
  );
}
