import type { LinkDTO, LinkListDTO } from "@/lib/dto/link";
import { frontFetchJson } from "./abstract-crus.service";

export type JobboardOption = {
  id: string;
  title: string;
};

export async function listJobboards(): Promise<JobboardOption[]> {
  const result = await frontFetchJson<LinkListDTO>("/api/links?category=JOBBOARD&pageSize=100");
  return result.items.map((link: LinkDTO) => ({ id: link.id, title: link.title }));
}
