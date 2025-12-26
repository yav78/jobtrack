import type { CompanyDTO, LocationDTO } from "@/lib/dto/company";
import type { ContactDTO } from "@/lib/dto/contact";
import { AbstractCrudService } from "./abstract-crus.service";

type CompanyListResponse = { items?: CompanyDTO[] };
type CompanyDetail = CompanyDTO & { locations?: LocationDTO[]; contacts?: ContactDTO[] };

class CompanyService extends AbstractCrudService {
  constructor() {
    super("companies");
  }

  async list(): Promise<CompanyDTO[]> {
    try {
      const data = await this.getAll<CompanyListResponse>();
      return data.items ?? [];
    } catch {
      return [];
    }
  }

  async detail(id: string): Promise<CompanyDetail | null> {
    try {
      return await this.getById<CompanyDetail>(id);
    } catch {
      return null;
    }
  }
}

export default new CompanyService();
