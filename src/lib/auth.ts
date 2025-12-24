"use server";

import { auth } from "@/auth";
import { env } from "./env";

export type AuthContext = {
  userId: string;
};

export async function resolveUser(): Promise<AuthContext> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return { userId: session.user.id };
    }
    // Fallback pour compatibilité avec l'ancien système (développement/test)
    return { userId: env.AUTH_DEMO_USER_ID };
  } catch {
    // Hors runtime Next (tests): fallback env
    return { userId: env.AUTH_DEMO_USER_ID };
  }
}

