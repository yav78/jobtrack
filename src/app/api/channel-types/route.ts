import { jsonError, jsonOk } from "@/lib/errors/response";
import { getChannelTypes } from "@/lib/services/channel-types";
import type { ChannelTypeDTO } from "@/lib/dto/channel";

export async function GET() {
  try {
    const channelTypes = await getChannelTypes();

    const items: ChannelTypeDTO[] = channelTypes.map((ct) => ({
      code: ct.code,
      label: ct.label,
    }));

    return jsonOk({ items });
  } catch (error) {
    console.error("Error fetching channel types:", error);
    return jsonError(error);
  }
}

