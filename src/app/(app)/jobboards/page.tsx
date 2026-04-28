import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLinks } from "@/lib/services/back/links";
import { getApplicationsByJobboard } from "@/lib/services/back/opportunity-actions";
import { serializeLinkListFromDb } from "@/lib/mappers/link";
import JobboardsPageClient from "./JobboardsPageClient";

export const dynamic = "force-dynamic";

export default async function JobboardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [listRaw, stats] = await Promise.all([
    getLinks(session.user.id, { page: 1, pageSize: 20, category: "JOBBOARD" }),
    getApplicationsByJobboard(session.user.id),
  ]);
  const initialList = serializeLinkListFromDb(listRaw);
  const applicationCounts = Object.fromEntries(stats.map((s) => [s.linkId ?? "", s.count]));

  return <JobboardsPageClient initialList={initialList} applicationCounts={applicationCounts} />;
}
