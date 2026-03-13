"use client";

import React from "react";

type Column<T> = {
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T extends { id: string }> = {
  data: T[];
  columns: Column<T>[];
  empty?: React.ReactNode;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
};

export function DataTable<T extends { id: string }>({
  data,
  columns,
  empty,
  selectable,
  selectedIds,
  onSelectionChange,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <div className="text-sm text-neutral-500">{empty ?? "Aucune donnée"}</div>;
  }

  const allSelected = data.length > 0 && data.every((row) => selectedIds?.has(row.id));
  const someSelected = data.some((row) => selectedIds?.has(row.id));

  function toggleAll() {
    if (!onSelectionChange) return;
    if (allSelected) {
      const next = new Set(selectedIds);
      data.forEach((row) => next.delete(row.id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      data.forEach((row) => next.add(row.id));
      onSelectionChange(next);
    }
  }

  function toggleRow(id: string) {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  return (
    <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 text-left dark:bg-neutral-900">
          <tr>
            {selectable && (
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allSelected && someSelected;
                  }}
                  onChange={toggleAll}
                  aria-label="Tout sélectionner"
                />
              </th>
            )}
            {columns.map((col) => (
              <th key={col.header} className={`px-3 py-2 font-medium ${col.className ?? ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              className={`border-t border-neutral-100 dark:border-neutral-800 ${
                selectable && selectedIds?.has(row.id)
                  ? "bg-blue-50 dark:bg-blue-950/30"
                  : ""
              }`}
            >
              {selectable && (
                <td className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(row.id) ?? false}
                    onChange={() => toggleRow(row.id)}
                    aria-label="Sélectionner"
                  />
                </td>
              )}
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
