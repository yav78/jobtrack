import { resolveFetchUrl } from "@/lib/api";
import type { CrudServiceInterface } from "./crud-service.interface";

async function frontFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const isHttp = path.startsWith("http://") || path.startsWith("https://");
  const url = isHttp ? path : await resolveFetchUrl(path);

  // Ajouter les cookies côté serveur pour les appels API authentifiés
  let cookieHeader: string | undefined;
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const store = await cookies();
      const raw = store.getAll();
      if (raw.length > 0) {
        cookieHeader = raw.map((c) => `${c.name}=${c.value}`).join("; ");
      }
    } catch {
      // headers non disponibles (build/test)
    }
  }

  const headers = new Headers(init?.headers);
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }
  if (cookieHeader && !headers.has("cookie")) {
    headers.set("cookie", cookieHeader);
  }

  const response = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      message = (data as { error?: string }).error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export abstract class AbstractCrudService implements CrudServiceInterface {
  protected readonly basePath: string;

  constructor(entity: string) {
    this.basePath = `/api/${entity}`;
  }

  async getAll<T = unknown>(): Promise<T> {
    return frontFetchJson<T>(this.basePath);
  }

  async getById<T = unknown>(id: string): Promise<T> {
    return frontFetchJson<T>(`${this.basePath}/${id}`);
  }

  async create<T = unknown>(data: unknown): Promise<T> {
    return frontFetchJson<T>(this.basePath, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update<T = unknown>(id: string, data: unknown): Promise<T> {
    return frontFetchJson<T>(`${this.basePath}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete<T = unknown>(id: string): Promise<T> {
    return frontFetchJson<T>(`${this.basePath}/${id}`, {
      method: "DELETE",
    });
  }
}

export { frontFetchJson };
