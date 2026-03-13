"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pushToast } from "@/components/common/Toast";
import opportunityActionService from "@/lib/services/front/opportunity-action.service";

type Props = {
  actionId: string;
  /** Si fourni, suppression via la route opportunité ; sinon via /api/actions/[actionId] */
  opportunityId?: string;
  onDeleted?: () => void;
};

export function ActionDeleteButton({ actionId, opportunityId, onDeleted }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette action ?")) {
      return;
    }

    setLoading(true);
    try {
      await opportunityActionService.deleteAction(actionId, opportunityId);
      pushToast({ type: "success", title: "Action supprimée" });
      onDeleted?.();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      pushToast({ type: "error", title: "Erreur suppression", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-600 hover:underline dark:text-red-400 disabled:opacity-50"
    >
      {loading ? "Suppression..." : "Supprimer"}
    </button>
  );
}
