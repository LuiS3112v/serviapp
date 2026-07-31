import "server-only";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

// ═══════════════════════════════════════════════════════════════════════
// SEGUNDA CAMADA DE DEFESA (defense in depth)
//
// O proxy.ts é a primeira barreira e bloqueia a esmagadora maioria dos
// pedidos antes de qualquer render. Mas nunca se deve confiar numa única
// camada — foi exatamente confiar cegamente no middleware.ts (que afinal
// nunca corria de forma garantida nesta versão) que causou o incidente
// original.
//
// Este ficheiro é "server-only": nunca é incluído no bundle do browser.
// Cada layout de grupo privado ((dashboard), (provider), admin) chama
// requireRole() ANTES de renderizar `children`. Se a validação falhar,
// redirect() do Next.js interrompe o render imediatamente no servidor —
// o HTML da página protegida nunca chega a ser gerado, logo não há
// nenhum flash possível, mesmo em cenários de cache/CDN mal configurados
// ou de regressão futura no proxy.
// ═══════════════════════════════════════════════════════════════════════

export type EffectiveRole = "client" | "provider" | "company" | "admin";

type TokenPayload = { email: string; role: string };

async function verifyToken(token: string): Promise<TokenPayload | null> {
  if (!process.env.JWT_SECRET) {
    console.error("[session.server] JWT_SECRET is not configured");
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

/**
 * Lê e valida a sessão atual a partir do cookie "serviapp_token".
 * Retorna null se não houver sessão válida — nunca lança exceção.
 */
export async function getServerSession(): Promise<{
  email: string;
  role: EffectiveRole;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("serviapp_token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isSuperAdmin =
    superAdminEmails.length > 0 && superAdminEmails.includes(payload.email);

  const effectiveRole: EffectiveRole = isSuperAdmin
    ? "admin"
    : (payload.role as EffectiveRole);

  return { email: payload.email, role: effectiveRole };
}

/**
 * Usar no topo de um layout de Server Component de um grupo privado.
 * Se não houver sessão → redirect imediato para "/", sem renderizar nada.
 * Se allowedRoles for passado e a role não constar → redirect "/?auth=forbidden".
 *
 * Por ser chamado dentro de um layout Server Component (não "use client"),
 * este redirect acontece ANTES do HTML ser enviado ao browser — não há
 * hidratação, não há useEffect, não há flash possível.
 */
export async function requireRole(allowedRoles?: EffectiveRole[]) {
  const session = await getServerSession();

  if (!session) {
    redirect("/?auth=required");
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect("/?auth=forbidden");
  }

  return session;
}