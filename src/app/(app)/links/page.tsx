import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLinks } from "@/lib/services/back/links";
import { serializeLinkListFromDb } from "@/lib/mappers/link";
import LinksPageClient from "./LinksPageClient";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const listRaw = await getLinks(session.user.id, {
    page: 1,
    pageSize: 20,
    category: ["TOOL", "NETWORK", "OTHER"],
  });
  const initialList = serializeLinkListFromDb(listRaw);

  return <LinksPageClient initialList={initialList} />;
}
