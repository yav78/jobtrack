import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getEntretien } from "@/lib/services/back/entretiens";
import { HttpError } from "@/lib/errors";

export default async function EntretienDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let entretien: Awaited<ReturnType<typeof getEntretien>>;
  try {
    entretien = await getEntretien(params.id, session.user.id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return notFound();
    throw e;
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">Entretien</h1>
      <div className="card space-y-2">
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          Date : {new Date(entretien.date).toLocaleString()}
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          Opportunité : {entretien.workOpportunity?.title ?? "-"}
        </div>
        <div className="text-sm text-neutral-600 dark:text-neutral-300">
          Canal : {entretien.contactChannel?.value ?? "-"}
        </div>
      </div>
    </div>
  );
}

