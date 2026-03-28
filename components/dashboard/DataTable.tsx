import * as React from "react";
import Link from "next/link";

export type Column<Row> = {
  key: string;
  header: string;
  cell: (users: Row, userId?: string[],) => React.ReactNode;
  className?: string;
};

type Props<Row> = {
  columns: Column<Row>[];
  users: Row[];
  userId: string[];

  keyForRow: (users: Row, index: number) => string;
};

export default function DataTable<Row>({ columns, userId, users, keyForRow }: Props<Row>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-dash-border bg-dash-card">
      <div className="grid gap-3 p-3 md:hidden">
        {users.map((user, idx) => (
          <div key={keyForRow(user, idx)} className="rounded-xl border border-dash-border bg-dash-bg p-4">
            <div className="grid gap-3">
              {columns.map((col) => (
                <div key={col.key} className="grid gap-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-dash-muted font-body">
                    {col.header}
                  </p>
                  <div className={["min-w-0 break-words text-sm text-dash-body font-body", col.className].filter(Boolean).join(" ")}>
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
        <thead className="bg-dash-bg border-b border-dash-border">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  "px-6 py-3 text-sm font-semibold uppercase tracking-wider text-dash-muted font-body",
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
          {users.map((user, idx) => (
            <tr key={keyForRow(user, idx)} className="hover:bg-dash-bg transition-colors">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    "min-w-0 break-words px-6 py-4 text-base text-dash-body font-body align-top",
                    col.className,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                 <Link href={`/${userId}`}> {col.cell(user, userId)}</Link>
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