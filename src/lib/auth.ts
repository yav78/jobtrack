"use server";

import { env } from "./env";
import { headers } from "next/headers";

export type AuthContext = {
  userId: string;
};

export async function resolveUser(): Promise<AuthContext> {
  try {
    const headerStore = await headers();
    const userId = headerStore.get("x-user-id") ?? env.AUTH_DEMO_USER_ID;
    return { userId };
  } catch {
    // Hors runtime Next (tests): fallback env
    return { userId: env.AUTH_DEMO_USER_ID };
  }
}

