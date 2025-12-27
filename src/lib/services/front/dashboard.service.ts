import type { OpportunityActionDTO } from "@/lib/dto/opportunity-action";
import type { OpportunityActionType } from "@prisma/client";
import { frontFetchJson } from "./abstract-crus.service";

type DashboardStats = {
  companies: number;
  contacts: number;
  opportunities: number;
  entretiens: number;
  actionsTotal: number;
  actionsLast30Days: number;
  actionsByType: Array<{ type: OpportunityActionType; count: number }>;
};

export type DashboardResponse = {
  stats: DashboardStats;
  recentActions: OpportunityActionDTO[];
};

export async function getDashboardOverview(): Promise<DashboardResponse> {
  
  return frontFetchJson<DashboardResponse>("/api/dashboard/overview");
  // return fetch("/api/dashboard/overview").then(response => response.json());
}
