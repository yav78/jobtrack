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

    try {
      // const data = await frontFetchJson<OpportunityActionListResponse>(
      //   `/api/opportunities/${opportunityId}/actions${search}`
      // );
      // return data.items ?? [];
      return fetch(`/api/opportunities/${opportunityId}/actions${search}`).then(response => response.json());
    } catch {
      return [];
    }
  }
}

export default new OpportunityActionService();
