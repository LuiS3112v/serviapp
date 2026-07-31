import { requireRole } from "@/lib/session.server";

// ═══════════════════════════════════════════════════════════════════════
// Layout do grupo /admin — ADMIN ONLY
//
// Corre DEPOIS do layout de (dashboard), que já garantiu que existe uma
// sessão válida com role "client" ou "admin". Este layout restringe mais:
// só "admin" passa. Um CLIENT autenticado a tentar /admin é ejetado aqui.
// ═══════════════════════════════════════════════════════════════════════

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"]);

  return <>{children}</>;
}