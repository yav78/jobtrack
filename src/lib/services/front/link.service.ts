import type { LinkDTO, LinkListDTO } from "@/lib/dto/link";
import { AbstractCrudService, frontFetchJson } from "./abstract-crus.service";

export type LinkCategoryFilter = "JOBBOARD" | "TOOL" | "NETWORK" | "OTHER";

export type LinkListFilters = {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: LinkCategoryFilter;
};

function buildListUrl(filters?: LinkListFilters): string {
  const params = new URLSearchParams();
  if (!filters) return "/api/links";
  if (filters.page != null) params.set("page", String(filters.page));
  if (filters.pageSize != null) params.set("pageSize", String(filters.pageSize));
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  const qs = params.toString();
  return qs ? `/api/links?${qs}` : "/api/links";
}

class LinkService extends AbstractCrudService {
  constructor() {
    super("links");
  }

  async list(filters?: LinkListFilters): Promise<LinkListDTO> {
    return frontFetchJson<LinkListDTO>(buildListUrl(filters));
  }

  async getOne(id: string): Promise<LinkDTO> {
    return this.getById<LinkDTO>(id);
  }

  async createLink(data: unknown): Promise<LinkDTO> {
    return this.create<LinkDTO>(data);
  }

  async updateLink(id: string, data: unknown): Promise<LinkDTO> {
    return this.update<LinkDTO>(id, data);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(id);
  }
}

const linkService = new LinkService();
export default linkService;
