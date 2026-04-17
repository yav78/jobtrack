import type { LinkDTO, LinkListDTO } from "@/lib/dto/link";
import type { LinkRecord } from "@/lib/services/back/links";

export function linkToDTO(link: LinkRecord): LinkDTO {
  return {
    id: link.id,
    userId: link.userId,
    title: link.title,
    url: link.url,
    notes: link.notes,
    category: link.category,
    deletedAt: link.deletedAt?.toISOString() ?? null,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  };
}

export function serializeLinkListFromDb(result: {
  items: LinkRecord[];
  page: number;
  pageSize: number;
  total: number;
}): LinkListDTO {
  return {
    items: result.items.map(linkToDTO),
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  };
}
