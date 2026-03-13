import type { WorkOpportunityDTO } from "@/lib/dto/opportunity";
import { AbstractCrudService, frontFetchJson } from "./abstract-crus.service";

type OpportunityListResponse = { items?: WorkOpportunityDTO[]; total?: number; page?: number; pageSize?: number };

export type OpportunityPage = { items: WorkOpportunityDTO[]; total: number; page: number; pageSize: number };

export type OpportunityFilters = {
  q?: string;
  status?: string;
};

class OpportunityService extends AbstractCrudService {
  constructor() {
    super("opportunities");
  }

  async list(page = 1, pageSize = 20, filters?: OpportunityFilters): Promise<OpportunityPage> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (filters?.q) params.set("q", filters.q);
    if (filters?.status) params.set("status", filters.status);
    const data = await frontFetchJson<OpportunityListResponse>(`${this.basePath}?${params.toString()}`);
    return {
      items: data.items ?? [],
      total: data.total ?? 0,
      page: data.page ?? page,
      pageSize: data.pageSize ?? pageSize,
    };
  }

  async listAll(pageSize = 300): Promise<WorkOpportunityDTO[]> {
    const data = await frontFetchJson<OpportunityListResponse>(
      `${this.basePath}?pageSize=${pageSize}`
    );
    return data.items ?? [];
  }

  async detail(id: string): Promise<WorkOpportunityDTO | null> {
    return await this.getById<WorkOpportunityDTO>(id);
  }
}

export default new OpportunityService();
