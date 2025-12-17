"use client";

import React from "react";

type Column<T> = {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  empty?: React.ReactNode;
};

export function DataTable<T>({ data, columns, empty }: DataTableProps<T>) {
  if (data.length === 0) {
    return <div className="text-sm text-neutral-500">{empty ?? "Aucune donnée"}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 text-left dark:bg-neutral-900">
          <tr>
            {columns.map((col) => (
              <th key={col.header} className={`px-3 py-2 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t border-neutral-100 dark:border-neutral-800">
              {columns.map((col) => (
                <td key={col.header} className={`px-3 py-2 ${col.className ?? ""}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

