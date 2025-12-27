import { unstable_cache as cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getChannelTypes = cache(
  async () => prisma.channelType.findMany({ orderBy: { code: "asc" } }),
  ["channelTypes"],
  { revalidate: 60 * 60, tags: ["refdata"] }
);

export async function updateChannelType(code: string, data: { label: string }) {
  const updated = await prisma.channelType.update({
    where: { code },
    data,
  });
  revalidateTag("refdata", "max");
  return updated;
}

export async function createChannelType(data: { code: string; label: string }) {
  const created = await prisma.channelType.create({ data });
  revalidateTag("refdata", "max");
  return created;
}

export async function deleteChannelType(code: string) {
  await prisma.channelType.delete({ where: { code } });
  revalidateTag("refdata", "max");
}

