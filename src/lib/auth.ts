"use server";

import { auth } from "@/auth";
import { Unauthorized } from "@/lib/errors";
import { env } from "@/lib/env";

export type AuthContext = {
  userId: string;
};

export async function resolveUser(): Promise<AuthContext> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return { userId: session.user.id };
    }
  } catch {
    // Outside of a Next.js request scope (e.g. Vitest integration tests):
    // fall back to the demo user id so integration tests can exercise routes.
    if (env.NODE_ENV !== "production" && env.AUTH_DEMO_USER_ID) {
      return { userId: env.AUTH_DEMO_USER_ID };
    }
  }
  throw Unauthorized("Authentification requise");
}
