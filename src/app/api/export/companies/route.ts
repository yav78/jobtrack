import { handleRouteError, requireUserId } from "@/lib/api-helpers";
import { getAllCompaniesForExport } from "@/lib/services/back/companies";

function toCsv(rows: Record<string, unknown>[], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const items = await getAllCompaniesForExport(userId);
    const rows = items.map((c) => ({
      id: c.id,
      nom: c.name,
      type: c.companyType?.label ?? c.typeCode,
      site: c.website ?? "",
      notes: c.notes ?? "",
      createdAt: new Date(c.createdAt).toISOString().slice(0, 10),
    }));
    const csv = toCsv(rows as unknown as Record<string, unknown>[], [
      "id",
      "nom",
      "type",
      "site",
      "notes",
      "createdAt",
    ]);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="entreprises.csv"',
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
