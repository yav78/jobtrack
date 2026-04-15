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
  } catch (err) {
    // Only fall back when called outside a Next.js request scope
    // (e.g. Vitest integration tests that call route handlers directly).
    // Real auth errors (wrong config, DB down, etc.) must propagate.
    const isOutsideRequestScope =
      err instanceof Error &&
      err.message.includes("outside a request scope");
    if (isOutsideRequestScope && env.NODE_ENV !== "production" && env.AUTH_DEMO_USER_ID) {
      return { userId: env.AUTH_DEMO_USER_ID };
    }
    throw err;
  }
  throw Unauthorized("Authentification requise");
}
