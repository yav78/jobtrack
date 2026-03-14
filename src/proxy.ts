import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

// ──────────────────────────────────────────────────
// Rate limiter (Edge-compatible, in-memory)
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
  if (!rule || req.method !== "POST") return true;

  const ip = getIp(req);
  const key = `${ip}:${req.nextUrl.pathname.split("?")[0]}`;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + rule.windowMs });
    return true;
  }

  entry.count += 1;
  return entry.count <= rule.max;
}

// ──────────────────────────────────────────────────
// Proxy (auth + rate limiting)
// ──────────────────────────────────────────────────
export default auth((req) => {
  // Rate limiting
  if (!checkRateLimit(req)) {
    return new NextResponse(
      JSON.stringify({ error: "Trop de tentatives. Réessayez dans une minute." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
    );
  }

  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isOnApp =
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/companies") ||
    nextUrl.pathname.startsWith("/contacts") ||
    nextUrl.pathname.startsWith("/opportunities") ||
    nextUrl.pathname.startsWith("/entretiens") ||
    nextUrl.pathname.startsWith("/actions") ||
    nextUrl.pathname.startsWith("/trash") ||
    nextUrl.pathname.startsWith("/docs");

  if (isOnApp && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/companies", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)"],
};
