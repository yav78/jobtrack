import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// ──────────────────────────────────────────────────
// Rate limiter (Edge-compatible, in-memory)
// Limites : 10 tentatives/min sur login, 5/min sur inscription
// ──────────────────────────────────────────────────
type RateWindow = { count: number; resetAt: number };
const store = new Map<string, RateWindow>();

const RULES: Array<{ pattern: RegExp; max: number; windowMs: number }> = [
  { pattern: /^\/api\/auth\/callback\/credentials/, max: 10, windowMs: 60_000 },
  { pattern: /^\/(login|register)$/, max: 20, windowMs: 60_000 },
];

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(req: NextRequest): boolean {
  const rule = RULES.find((r) => r.pattern.test(req.nextUrl.pathname));
  if (!rule || req.method !== "POST") return true; // pass non-POST through

  const ip = getIp(req);
  const key = `${ip}:${req.nextUrl.pathname.split("?")[0]}`;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }

  entry.count += 1;
  if (entry.count > rule.max) return false;
  return true;
}

// ──────────────────────────────────────────────────
// NextAuth middleware (route protection)
// ──────────────────────────────────────────────────
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Rate limiting
  if (!checkRateLimit(req)) {
    return new NextResponse(JSON.stringify({ error: "Trop de tentatives. Réessayez dans une minute." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
