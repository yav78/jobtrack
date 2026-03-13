import type { CompanyDTO, LocationDTO } from "@/lib/dto/company";
import type { ContactDTO } from "@/lib/dto/contact";
import { AbstractCrudService, frontFetchJson } from "./abstract-crus.service";

type CompanyListResponse = { items?: CompanyDTO[] };
type CompanyDetail = CompanyDTO & { locations?: LocationDTO[]; contacts?: ContactDTO[] };

class CompanyService extends AbstractCrudService {
  constructor() {
    super("companies");
  }

  async list(): Promise<CompanyDTO[]> {
    const data = await this.getAll<CompanyListResponse>();
    return data.items ?? [];
  }

  async detail(id: string): Promise<CompanyDetail | null> {
    return await this.getById<CompanyDetail>(id);
  }

  async createLocation(companyId: string, data: unknown): Promise<LocationDTO> {
    return frontFetchJson<LocationDTO>(`/api/companies/${companyId}/locations`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLocation(locationId: string, data: unknown): Promise<LocationDTO> {
    return frontFetchJson<LocationDTO>(`/api/locations/${locationId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteLocation(locationId: string): Promise<void> {
    await frontFetchJson<void>(`/api/locations/${locationId}`, { method: "DELETE" });
  }
}

export default new CompanyService();
