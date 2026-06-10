import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * src/middleware.ts
 *
 * ─── What changed from the previous version ──────────────────────────────────
 *
 *  1. PROTECTED_ROUTES added ("/home")
 *     Unauthenticated requests to /home → redirect to "/?auth=required&redirect=/home"
 *     Previously /home had zero server-side protection.
 *
 *  2. GUEST_ONLY_ROUTES added ("/", "/login")
 *     Authenticated requests to these routes → server-side redirect to "/home"
 *     Server-side redirects (NextResponse.redirect) do NOT add a browser history
 *     entry, which means the back button can never return to the landing page.
 *     This is the infrastructure fix for Root Cause 2 of the back-button bug.
 *
 *  3. verifyToken() extracted as a standalone helper (reduces nesting, reusable).
 *
 *  4. Matcher extended to include "/home", "/home/:path*", "/", "/login".
 *
 * ─── What is intentionally NOT in GUEST_ONLY_ROUTES ─────────────────────────
 *
 *  "/register/provider" and "/criar-perfil" serve dual duty:
 *    • Unauthenticated new-provider signup
 *    • Authenticated client upgrading to provider ("Sou prestador / Criar perfil")
 *  Blocking authenticated users there would break the client-home → provider flow.
 *
 * ─── What is preserved unchanged from the previous version ───────────────────
 *
 *  • JWT signature verification (not just cookie presence check)
 *  • Super-admin bypass via SUPER_ADMIN_EMAILS env var
 *  • Expired/tampered token: cookie cleared + redirect to "/?auth=session_expired"
 *  • Admin forbidden: redirect to "/?auth=forbidden"
 *  • Fail-closed when JWT_SECRET is missing
 *
 * ─── Security model (unchanged) ──────────────────────────────────────────────
 *
 *  Middleware = first line of defence (UX gate, Edge runtime, fast).
 *  Backend JwtGuard + RolesGuard = authoritative second line.
 *  Both must pass. A compromised frontend cannot bypass backend guards.
 */

// ── Route tables ──────────────────────────────────────────────────────────────

/**
 * Routes that require a valid authenticated session.
 * Add new authenticated sections here as the app grows
 * (e.g., "/bookings", "/profile", "/chat", "/services").
 */
const PROTECTED_ROUTES = [
  "/home",
];

/**
 * Routes that should NEVER be rendered for an authenticated user.
 * Any valid-token request here gets a server-side redirect to "/home".
 *
 * Server-side redirect = no browser history entry added = back button
 * can never bounce the user back to the landing / login page.
 */
const GUEST_ONLY_ROUTES = [
  "/",
  "/login",
];

// ── Token verification helper ─────────────────────────────────────────────────

type TokenPayload = { email: string; role: string };

async function verifyToken(token: string): Promise<TokenPayload | null> {
  if (!process.env.JWT_SECRET) {
    console.error("[middleware] JWT_SECRET is not configured");
    return null;
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      email: ((payload.email as string) ?? "").trim().toLowerCase(),
      role:  (payload.role  as string) ?? "",
    };
  } catch {
    // Expired or tampered — treated as unauthenticated
    return null;
  }
}

// ── Middleware ─────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute     = pathname.startsWith("/admin");
  const isProtectedRoute = PROTECTED_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + "/"),
  );
  const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);

  // Not a route we manage → pass straight through, no overhead
  if (!isAdminRoute && !isProtectedRoute && !isGuestOnly) {
    return NextResponse.next();
  }

  const token = request.cookies.get("serviapp_token")?.value;

  // ── No token ──────────────────────────────────────────────────────────────
  if (!token) {
    if (isAdminRoute || isProtectedRoute) {
      // Redirect to landing with intent preserved so the login UI can redirect
      // the user back to their intended destination after a successful login.
      const url = new URL("/", request.url);
      url.searchParams.set("auth", "required");
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    // Guest-only route without a token → correct state, let them through
    return NextResponse.next();
  }

  // ── Verify token ──────────────────────────────────────────────────────────
  const payload = await verifyToken(token);

  if (!payload) {
    // Invalid or expired token — clear the stale cookie
    const destination = isGuestOnly
      ? NextResponse.next()   // let them stay on public page with cleared cookie
      : NextResponse.redirect(new URL("/?auth=session_expired", request.url));

    destination.cookies.set("serviapp_token", "", {
      path:     "/",
      maxAge:   0,
      sameSite: "lax",
    });
    return destination;
  }

  const { email, role } = payload;

  // ── Admin routes: role check ──────────────────────────────────────────────
  if (isAdminRoute) {
    // Super-admin bypass: owner is never locked out by a stale token role.
    // Format: SUPER_ADMIN_EMAILS=owner@example.com,backup@example.com
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? "")
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    const isSuperAdmin =
      superAdminEmails.length > 0 && superAdminEmails.includes(email);

    if (role !== "admin" && !isSuperAdmin) {
      return NextResponse.redirect(new URL("/?auth=forbidden", request.url));
    }

    return NextResponse.next();
  }

  // ── Guest-only + valid token → redirect to /home ──────────────────────────
  //
  // This is the core fix for the browser back-button bug (Root Cause 2).
  //
  // Scenario: authenticated user presses browser back and lands on "/" because
  // it was somewhere in the history stack (e.g., from the initial page load).
  // Without this guard, the landing page renders for an authenticated user.
  // With it, the browser follows the server redirect to /home — no new history
  // entry is created, so the back button cannot loop back here.
  if (isGuestOnly) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // ── Protected route + valid token → allow ────────────────────────────────
  return NextResponse.next();
}

// ── Matcher ────────────────────────────────────────────────────────────────────
//
// Must stay in sync with the route tables above.
// Rules:
//   "/foo"        matches exactly /foo
//   "/foo/:path*" matches /foo/anything (zero or more segments)
//
// Do NOT add /api, /_next, or /favicon — those bypass middleware automatically
// via Next.js internals but adding them here causes unnecessary Edge invocations.

export const config = {
  matcher: [
    // Admin (unchanged)
    "/admin/:path*",

    // Protected: authenticated client routes
    "/home",
    "/home/:path*",

    // Guest-only: public-only routes (back-button guard)
    "/",
    "/login",
  ],
};