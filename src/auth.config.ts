import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnApp =
        nextUrl.pathname === "/" ||
        nextUrl.pathname.startsWith("/companies") ||
        nextUrl.pathname.startsWith("/contacts") ||
        nextUrl.pathname.startsWith("/opportunities") ||
        nextUrl.pathname.startsWith("/entretiens");

      if (isOnApp) {
        if (isLoggedIn) return true;
        return false; // Rediriger les utilisateurs non authentifiés vers la page de login
      } else if (isLoggedIn && nextUrl.pathname === "/login") {
        return false; // Le proxy gérera la redirection
      }
      return true;
    },
  },
  providers: [], // Les providers seront ajoutés dans auth.ts
} satisfies NextAuthConfig;

