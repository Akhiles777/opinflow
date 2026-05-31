import * as React from "react";

export type Column<Row> = {
  key: string;
  header: string;
  cell: (users: Row, userId?: string[]) => React.ReactNode;
  className?: string;
};

type Props<Row> = {
  columns: Column<Row>[];
  users?: Row[];
  rows?: Row[];
  userId?: string[];
  keyForRow: (users: Row, index: number) => string;
};

export default function DataTable<Row>({ columns, userId, users, rows, keyForRow }: Props<Row>) {
  const data = users ?? rows ?? [];

  return (
    <div className="overflow-hidden rounded-[18px] border border-dash-border bg-dash-card">
      <div className="grid gap-3 p-3 md:hidden">
        {data.map((user, idx) => (
          <div key={keyForRow(user, idx)} className="rounded-[14px] border border-dash-border bg-dash-bg/70 p-4">
            <div className="grid gap-3">
              {columns.map((col) => (
                <div key={col.key} className="grid gap-1">
                  <p className="text-sm font-semibold uppercase tracking-wider text-dash-muted font-body">
                    {col.header}
                  </p>
                  <div className={["min-w-0 break-words text-[15px] text-dash-body font-body", col.className].filter(Boolean).join(" ")}>
                    {col.cell(user, userId)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-left">
        <thead className="border-b border-dash-border bg-dash-bg/55">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  "px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-dash-muted",
                  col.className,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-dash-border">
          {data.map((user, idx) => (
            <tr key={keyForRow(user, idx)} className="transition-colors odd:bg-dash-bg/35 hover:bg-dash-bg/70">
              {columns.map((col) => (
                <td
                  key={col.key}
                className={[
                    "min-w-0 break-words px-6 py-4 text-[15px] font-medium text-dash-body align-top",
                    col.className,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {col.cell(user, userId)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
