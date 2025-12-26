"use server";

import { auth } from "@/auth";
import { Unauthorized } from "@/lib/errors";

export type AuthContext = {
  userId: string;
};

export async function resolveUser(): Promise<AuthContext> {
  const session = await auth();
  if (session?.user?.id) {
    return { userId: session.user.id };
  }
  throw Unauthorized("Authentification requise");
}
