import type { ContactDTO } from "@/lib/dto/contact";
import type { ContactChannelDTO } from "@/lib/dto/channel";
import { AbstractCrudService, frontFetchJson } from "./abstract-crus.service";

type ContactListResponse = { items?: ContactDTO[]; total?: number; page?: number; pageSize?: number };

export type ContactPage = { items: ContactDTO[]; total: number; page: number; pageSize: number };

class ContactService extends AbstractCrudService {
  constructor() {
    super("contacts");
  }

  async list(page = 1, pageSize = 20): Promise<ContactPage> {
    const data = await frontFetchJson<ContactListResponse>(
      `${this.basePath}?page=${page}&pageSize=${pageSize}`
    );
    return {
      items: data.items ?? [],
      total: data.total ?? 0,
      page: data.page ?? page,
      pageSize: data.pageSize ?? pageSize,
    };
  }

  async listAll(pageSize = 300): Promise<ContactDTO[]> {
    const data = await frontFetchJson<ContactListResponse>(
      `${this.basePath}?pageSize=${pageSize}`
    );
    return data.items ?? [];
  }

  async listByCompany(companyId: string): Promise<ContactDTO[]> {
    const data = await frontFetchJson<ContactListResponse>(
      `${this.basePath}?companyId=${encodeURIComponent(companyId)}`
    );
    return data.items ?? [];
  }

  async listUnlinked(): Promise<ContactDTO[]> {
    const data = await frontFetchJson<ContactListResponse>(
      `${this.basePath}?unlinked=true&pageSize=300`
    );
    return data.items ?? [];
  }

  async detail(id: string): Promise<ContactDTO | null> {
    return await this.getById<ContactDTO>(id);
  }

  async createChannel(contactId: string, data: unknown): Promise<ContactChannelDTO> {
    return frontFetchJson<ContactChannelDTO>(`/api/contacts/${contactId}/channels`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export default new ContactService();
