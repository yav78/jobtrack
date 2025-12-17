"use client";

import { useEffect, useState } from "react";

type ToastMessage = {
  id: string;
  type?: "success" | "error" | "info";
  title: string;
  description?: string;
};

let pushToastExternal: ((msg: Omit<ToastMessage, "id">) => void) | null = null;

export function ToastProvider() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    pushToastExternal = (msg) => {
      const id = crypto.randomUUID();
      setMessages((prev) => [...prev, { id, ...msg }]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }, 3500);
    };
    return () => {
      pushToastExternal = null;
    };
  }, []);

  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`rounded-md border px-3 py-2 text-sm shadow ${
            m.type === "error"
              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100"
              : m.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                : "border-neutral-200 bg-white text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
          }`}
        >
          <div className="font-semibold">{m.title}</div>
          {m.description && <div className="text-xs">{m.description}</div>}
        </div>
      ))}
    </div>
  );
}

export function pushToast(msg: Omit<ToastMessage, "id">) {
  if (pushToastExternal) pushToastExternal(msg);
}

