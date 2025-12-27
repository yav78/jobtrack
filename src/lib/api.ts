export async function apiGet<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(absoluteUrl(url), { cache: "no-store", ...init });
  if (!res.ok) {
    const data = await safeJson(res);
    throw new Error(data?.error || `GET ${url} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T>(url: string, body: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(absoluteUrl(url), {
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

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  
  let base = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
  console.log("process.env.NEXT_PUBLIC_BASE_URL", process.env.NEXT_PUBLIC_BASE_URL);
  console.log("process.env.VERCEL_URL", process.env.VERCEL_URL);
  console.log("path", path);
  console.log("base", base);
  
  // S'assurer que la base a un protocole
  // if (!base.startsWith("http://") && !base.startsWith("https://")) {
  //   // Si c'est VERCEL_URL, utiliser https par défaut
  //   if (process.env.VERCEL_URL) {
  //     base = `https://${base}`;
  //   } else {
  //     base = `http://${base}`;
  //   }
  // }
  
  const result = new URL(path, base).toString();
  console.log("result url absolute", result);
  return result;
}

