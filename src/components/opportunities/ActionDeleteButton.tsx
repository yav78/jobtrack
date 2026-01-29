"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pushToast } from "@/components/common/Toast";

type Props = {
  actionId: string;
  opportunityId: string;
};

export function ActionDeleteButton({ actionId, opportunityId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette action ?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/actions/${actionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      pushToast({ type: "success", title: "Action supprimée" });
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

