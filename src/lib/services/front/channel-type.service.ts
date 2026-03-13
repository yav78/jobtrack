import type { ChannelTypeDTO } from "@/lib/dto/channel";
import { frontFetchJson } from "./abstract-crus.service";

type ChannelTypeListResponse = { items?: ChannelTypeDTO[] };

class ChannelTypeService {
  async list(): Promise<ChannelTypeDTO[]> {
    const data = await frontFetchJson<ChannelTypeListResponse>("/api/channel-types");
    return data.items ?? [];
  }
}

export default new ChannelTypeService();
