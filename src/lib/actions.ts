"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { AuthError } from "next-auth";
import { z } from "zod";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Identifiants invalides.";
        default:
          return "Une erreur s'est produite.";
      }
    }
    throw error;
  }
}

const registerSchema = z.object({
  fullName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export async function registerUser(prevState: string | undefined, formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Données invalides.";
  }

  const { fullName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return "Un compte existe déjà avec cet email.";
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/companies" });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Inscription réussie, mais la connexion a échoué.";
    }
    throw error;
  }

  return undefined;
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
