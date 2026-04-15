export async function apiGet<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(await resolveFetchUrl(url), { cache: "no-store", ...init });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || `GET ${url} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T>(url: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(await resolveFetchUrl(url), {
    method: "POST",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    body: JSON.stringify(body),
    ...init,
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(data?.error || `POST ${url} failed`);
  return data as T;
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) usp.set(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Corrige des bases fréquentes sans schéma (ex. `localhost:3000` au lieu de `http://localhost:3000`). */
function normalizeBaseUrl(raw: string | undefined | null): string | undefined {
  if (raw == null || String(raw).trim() === "") return undefined;
  const t = String(raw).trim();
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  if (/^[A-Za-z0-9._-]+(?::\d+)?$/.test(t)) return `http://${t}`;
  return t;
}

/**
 * URL utilisable par `fetch` : en navigateur, chemins relatifs (même origine).
 * Sur le serveur (RSC), origine dérivée des en-têtes (Docker / proxy), sinon variables d’environnement.
 */
export async function resolveFetchUrl(path: string): Promise<string> {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (typeof window !== "undefined") return path;

  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
      return new URL(path, `${proto}://${host}`).toString();
    }
  } catch {
    // hors contexte requête (build, tests, etc.)
  }

  return absoluteUrl(path);
}

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;

  const candidates: Array<string | undefined> = [
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL),
    typeof window !== "undefined" ? window.location.origin : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    normalizeBaseUrl(process.env.AUTH_URL),
    "http://localhost:3000",
  ];

  for (const base of candidates) {
    if (!base) continue;
    try {
      return new URL(path, base).toString();
    } catch {
      continue;
    }
  }
  return new URL(path, "http://localhost:3000").toString();
}

