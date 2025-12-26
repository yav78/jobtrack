import type { ContactDTO } from "@/lib/dto/contact";
import { AbstractCrudService } from "./abstract-crus.service";

type ContactListResponse = { items?: ContactDTO[] };

class ContactService extends AbstractCrudService {
  constructor() {
    super("contacts");
  }

  async list(): Promise<ContactDTO[]> {
    try {
      const data = await this.getAll<ContactListResponse>();
      return data.items ?? [];
    } catch {
      return [];
    }
  }

  async detail(id: string): Promise<ContactDTO | null> {
    try {
      return await this.getById<ContactDTO>(id);
    } catch {
      return null;
    }
  }
}

export default new ContactService();
