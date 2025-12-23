"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ActionTypeFilter } from "./ActionTypeFilter";
import type { OpportunityActionType } from "@prisma/client";

type Props = {
  opportunityId: string;
};

export function ActionTypeFilterClient({ opportunityId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") as OpportunityActionType | null;

  const handleChange = (type: OpportunityActionType | "ALL" | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === null || type === "ALL") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    router.push(`/opportunities/${opportunityId}?${params.toString()}`);
  };

  return <ActionTypeFilter value={currentType} onChange={handleChange} />;
}

