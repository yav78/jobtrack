import type { OpportunityActionDTO } from "@/lib/dto/opportunity-action";
import { AbstractCrudService, frontFetchJson } from "./abstract-crus.service";

type OpportunityActionListResponse = { items?: OpportunityActionDTO[] };

class OpportunityActionService extends AbstractCrudService {
  constructor() {
    super("opportunities");
  }

  async listByOpportunity(opportunityId: string, type?: string): Promise<OpportunityActionDTO[]> {
    if (!opportunityId) return [];
    const search = type ? `?type=${encodeURIComponent(type)}` : "";
    const data = await frontFetchJson<OpportunityActionListResponse>(
      `/api/opportunities/${opportunityId}/actions${search}`
    );
    return data.items ?? [];
  }

  async listAll(filters?: { type?: string; contactId?: string }): Promise<OpportunityActionDTO[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.set("type", filters.type);
    if (filters?.contactId) params.set("contactId", filters.contactId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await frontFetchJson<OpportunityActionListResponse>(`/api/actions${query}`);
    return data.items ?? [];
  }

  async createForOpportunity(opportunityId: string, data: unknown): Promise<OpportunityActionDTO> {
    return frontFetchJson<OpportunityActionDTO>(`/api/opportunities/${opportunityId}/actions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async createStandalone(data: unknown): Promise<OpportunityActionDTO> {
    return frontFetchJson<OpportunityActionDTO>(`/api/actions`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateStandalone(actionId: string, data: unknown): Promise<OpportunityActionDTO> {
    return frontFetchJson<OpportunityActionDTO>(`/api/actions/${actionId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAction(actionId: string, opportunityId?: string): Promise<void> {
    const url = opportunityId
      ? `/api/opportunities/${opportunityId}/actions/${actionId}`
      : `/api/actions/${actionId}`;
    await frontFetchJson<void>(url, { method: "DELETE" });
  }
}

export default new OpportunityActionService();
