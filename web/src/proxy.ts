import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ═══════════════════════════════════════════════════════════════════════
// PROXY (substitui middleware.ts a partir do Next.js 16)
// Ver comentário histórico original sobre a mudança de nome no Next 16.
//
// SEGREGAÇÃO POR ROLE:
//   CLIENT           → só CLIENT_ROUTES
//   PROVIDER/COMPANY → só PROVIDER_ROUTES
//   ADMIN            → só ADMIN_ROUTES
//   PENDING          → só CHOOSE_ROLE_ROUTE (NOVO)
// ═══════════════════════════════════════════════════════════════════════

const CLIENT_ROUTES = [
  "/home",
  "/services",
  "/wallet",
  "/profile",
  "/chat",
  "/map",
  "/notifications",
  "/security",
  "/categories",
  "/company",
  "/settings",
  "/transactions",
  "/onboarding",
  "/privacy",
  "/terms",
];

const PROVIDER_ROUTES = ["/provider-home", "/provider"];

const ADMIN_ROUTES = ["/admin"];

// NOVO — página de escolha de role, só para contas Google recém
// criadas (role=pending). Fica fora de CLIENT_ROUTES/PROVIDER_ROUTES
// de propósito: a regra de acesso aqui não é "role X pode", é "só
// quem ainda não escolheu role pode estar aqui".
const CHOOSE_ROLE_ROUTE = "/choose-role";

const ALL_PRIVATE_ROUTES = [...CLIENT_ROUTES, ...PROVIDER_ROUTES, ...ADMIN_ROUTES];

const GUEST_ONLY_ROUTES = ["/", "/login"];

type TokenPayload = { email: string; role: string };
type EffectiveRole = "client" | "provider" | "company" | "admin" | "pending";

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  if (!process.env.JWT_SECRET) {
    console.error("[proxy] JWT_SECRET is not configured — refusing all private routes");
    return null;
  }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return {
      email: ((payload.email as string) ?? "").trim().toLowerCase(),
      role: ((payload.role as string) ?? "").toLowerCase(),
    };
  } catch {
    return null;
  }
}

function homeForRole(role: EffectiveRole): string {
  if (role === "admin") return "/admin";
  if (role === "provider" || role === "company") return "/provider-home";
  if (role === "pending") return CHOOSE_ROLE_ROUTE;
  return "/home";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isClientRoute = matchesRoute(pathname, CLIENT_ROUTES);
  const isProviderRoute = matchesRoute(pathname, PROVIDER_ROUTES);
  const isAdminRoute = matchesRoute(pathname, ADMIN_ROUTES);
  const isPrivateRoute = matchesRoute(pathname, ALL_PRIVATE_ROUTES);
  const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);
  const isChooseRoleRoute = pathname === CHOOSE_ROLE_ROUTE;

  // ── NOVO: /choose-role — só acessível a quem tem role=pending ──────────
  if (isChooseRoleRoute) {
    const token = request.cookies.get("serviapp_token")?.value;

    if (!token) {
      const res = NextResponse.redirect(new URL("/", request.url));
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }

    const payload = await verifyToken(token);

    if (!payload) {
      const res = NextResponse.redirect(new URL("/?auth=session_expired", request.url));
      res.cookies.set("serviapp_token", "", { path: "/", maxAge: 0, sameSite: "lax" });
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }

    if (payload.role !== "pending") {
      // Já escolheu role anteriormente — não faz sentido voltar aqui.
      const res = NextResponse.redirect(
        new URL(homeForRole(payload.role as EffectiveRole), request.url),
      );
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }

    return NextResponse.next();
  }

  // Rota pública (não privada, não guest-only) → passa sem verificação
  if (!isPrivateRoute && !isGuestOnly) {
    return NextResponse.next();
  }

  const token = request.cookies.get("serviapp_token")?.value;

  // ── Sem token ──────────────────────────────────────────────────────────
  if (!token) {
    if (isPrivateRoute) {
      const url = new URL("/", request.url);
      url.searchParams.set("auth", "required");
      url.searchParams.set("redirect", pathname);
      const res = NextResponse.redirect(url);
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }
    return NextResponse.next();
  }

  // ── Verifica token ─────────────────────────────────────────────────────
  const payload = await verifyToken(token);

  if (!payload) {
    const destination = isGuestOnly
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/?auth=session_expired", request.url));

    destination.cookies.set("serviapp_token", "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
    destination.headers.set("Cache-Control", "no-store, max-age=0");
    return destination;
  }

  const { email, role } = payload;

  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isSuperAdmin =
    superAdminEmails.length > 0 && superAdminEmails.includes(email);

  const effectiveRole: EffectiveRole = isSuperAdmin
    ? "admin"
    : (role as EffectiveRole);

  // ── Segregação total nas rotas privadas ────────────────────────────────
  if (isAdminRoute) {
    if (effectiveRole !== "admin") {
      const res = NextResponse.redirect(new URL("/?auth=forbidden", request.url));
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }
    return NextResponse.next();
  }

  if (isProviderRoute) {
    if (effectiveRole !== "provider" && effectiveRole !== "company") {
      const res = NextResponse.redirect(new URL("/?auth=forbidden", request.url));
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }
    return NextResponse.next();
  }

  if (isClientRoute) {
    if (effectiveRole !== "client") {
      const res = NextResponse.redirect(new URL("/?auth=forbidden", request.url));
      res.headers.set("Cache-Control", "no-store, max-age=0");
      return res;
    }
    return NextResponse.next();
  }

  // ── Guest-only + token válido ──────────────────────────────────────────
  if (isGuestOnly) {
    const isLogout = request.nextUrl.searchParams.get("logout") === "1";
    if (isLogout) {
      const res = NextResponse.next();
      res.cookies.set("serviapp_token", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
      });
      return res;
    }
    const res = NextResponse.redirect(new URL(homeForRole(effectiveRole), request.url));
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/provider-home",
    "/provider-home/:path*",
    "/provider/:path*",
    "/home",
    "/home/:path*",
    "/services/:path*",
    "/wallet/:path*",
    "/profile/:path*",
    "/chat/:path*",
    "/map/:path*",
    "/notifications/:path*",
    "/security/:path*",
    "/categories/:path*",
    "/company/:path*",
    "/settings/:path*",
    "/transactions/:path*",
    "/onboarding/:path*",
    "/privacy/:path*",
    "/terms/:path*",
    "/",
    "/login",
    "/choose-role", // NOVO
  ],
};