import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_ROUTES = ["/home"];
const GUEST_ONLY_ROUTES = ["/", "/login"];

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
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminRoute     = pathname.startsWith("/admin");
  const isProtectedRoute = PROTECTED_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + "/"),
  );
  const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);

  if (!isAdminRoute && !isProtectedRoute && !isGuestOnly) {
    return NextResponse.next();
  }

  const token = request.cookies.get("serviapp_token")?.value;

  // ── Sem token ──────────────────────────────────────────────────────────
  if (!token) {
    if (isAdminRoute || isProtectedRoute) {
      const url = new URL("/", request.url);
      url.searchParams.set("auth", "required");
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    // guest-only sem token → página pública, deixa passar
    return NextResponse.next();
  }

  // ── Verifica token ─────────────────────────────────────────────────────
  const payload = await verifyToken(token);

  if (!payload) {
    // Token inválido/expirado — limpa o cookie
    const destination = isGuestOnly
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/?auth=session_expired", request.url));

    destination.cookies.set("serviapp_token", "", {
      path:     "/",
      maxAge:   0,
      sameSite: "lax",
    });
    return destination;
  }

  const { email, role } = payload;

  // ── Admin ──────────────────────────────────────────────────────────────
  if (isAdminRoute) {
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

  // ── Guest-only + token válido ──────────────────────────────────────────
  // FIX: já não redireciona para /home automaticamente — deixa o JS do cliente
  // tratar o redirect após logout (o cookie já foi limpo pelo clearAllSessions).
  // O problema anterior era: clearAllSessions() limpava o cookie no browser,
  // mas router.push("/") fazia um novo request onde o middleware ainda via
  // o cookie antigo no header (porque o browser ainda não tinha processado
  // a limpeza do cookie antes do fetch do middleware).
  // Solução: o middleware só redireciona para /home se o pathname for "/"
  // e o token for válido E a query não tiver "logout=1".
  if (isGuestOnly) {
    const isLogout = request.nextUrl.searchParams.get("logout") === "1";
    if (isLogout) {
      // Logout explícito — deixa passar para a landing page
      // e limpa o cookie para garantir
      const res = NextResponse.next();
      res.cookies.set("serviapp_token", "", {
        path: "/", maxAge: 0, sameSite: "lax",
      });
      return res;
    }
    // Token válido em página pública → redireciona para /home
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // ── Rota protegida + token válido → deixa passar ──────────────────────
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/home",
    "/home/:path*",
    "/",
    "/login",
  ],
};