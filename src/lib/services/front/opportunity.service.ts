import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import { AbstractCrudService } from "./abstract-crus.service";

type OpportunityListResponse = { items?: WorkOpportunityDTO[] };

class OpportunityService extends AbstractCrudService {
  constructor() {
    super("opportunities");
  }

  async list(): Promise<WorkOpportunityDTO[]> {
    try {
      const data = await this.getAll<OpportunityListResponse>();
      return data.items ?? [];
    } catch {
      return [];
    }
  }

  async detail(id: string): Promise<WorkOpportunityDTO | null> {
    try {
      return await this.getById<WorkOpportunityDTO>(id);
    } catch {
      return null;
    }
  }
}

export default new OpportunityService();
