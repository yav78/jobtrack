import type { OpportunityActionDTO } from "@/lib/dto/opportunity-action";
import type { OpportunityActionType, WorkOpportunityStatus } from "@prisma/client";
import { frontFetchJson } from "./abstract-crus.service";

type DashboardStats = {
  companies: number;
  contacts: number;
  opportunities: number;
  entretiens: number;
  actionsTotal: number;
  actionsLast30Days: number;
  actionsByType: Array<{ type: OpportunityActionType; count: number }>;
  opportunitiesByStatus: Array<{ status: WorkOpportunityStatus; count: number }>;
  upcomingFollowUps: Array<{
    id: string;
    title: string;
    status: WorkOpportunityStatus;
    followUpAt: string;
    isOverdue: boolean;
  }>;
};

export type DashboardResponse = {
  stats: DashboardStats;
  recentActions: OpportunityActionDTO[];
};

export async function getDashboardOverview(): Promise<DashboardResponse> {
  return frontFetchJson<DashboardResponse>("/api/dashboard/overview");
}
