import "server-only";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

// ═══════════════════════════════════════════════════════════════════════
// SEGUNDA CAMADA DE DEFESA (defense in depth) — ver comentário histórico
// original sobre porque este ficheiro existe a par do proxy.ts.
// ═══════════════════════════════════════════════════════════════════════

// ALTERADO: +"pending". Só afecta tipagem — nenhum layout existente
// (dashboard/provider) inclui "pending" no seu requireRole([...]),
// por isso continua impossível para uma conta pending aceder a
// qualquer área protegida através desta camada.
export type EffectiveRole = "client" | "provider" | "company" | "admin" | "pending";

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