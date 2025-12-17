"use client";

import React from "react";

type Tab = { key: string; label: string };

type TabsProps = {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-1 text-sm dark:border-neutral-800 dark:bg-neutral-900">
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`rounded px-3 py-1 transition ${
              active ? "bg-white shadow dark:bg-neutral-800" : "text-neutral-600 dark:text-neutral-300"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

