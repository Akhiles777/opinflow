import * as React from "react";

export type Column<Row> = {
  key: string;
  header: string;
  cell: (row: Row) => React.ReactNode;
  className?: string;
};

type Props<Row> = {
  columns: Column<Row>[];
  rows: Row[];
  keyForRow: (row: Row, index: number) => string;
};

export default function DataTable<Row>({ columns, rows, keyForRow }: Props<Row>) {
  return (
    <div className="bg-dash-card border border-dash-border rounded-2xl overflow-hidden">
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
          {rows.map((row, idx) => (
            <tr key={keyForRow(row, idx)} className="hover:bg-dash-bg transition-colors">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    "px-6 py-4 text-base text-dash-body font-body",
                    col.className,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
