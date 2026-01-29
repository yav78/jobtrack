"use client";

import { useState } from "react";
import { ActionsListClient } from "@/components/actions/ActionsListClient";
import { StandaloneActionForm } from "@/components/actions/StandaloneActionForm";

export default function ActionsPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Actions</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Toutes vos actions (prises de contact, entretiens, relances…) avec ou sans opportunité.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Nouvelle action
        </button>
      </div>

      <div className="card">
        <ActionsListClient />
      </div>

      <StandaloneActionForm open={showForm} onClose={() => setShowForm(false)} />
    </div>
  );
}
