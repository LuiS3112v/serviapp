import { requireRole } from "@/lib/session.server";

// ═══════════════════════════════════════════════════════════════════════
// Layout do grupo (dashboard) — CLIENT ONLY
//
// Cobre: /home, /services, /wallet, /profile, /chat, /map, /notifications,
// /security, /categories, /company, /settings, /transactions, /onboarding,
// /privacidade, /privacy, /termos, /terms, /admin (ver nota abaixo)
//
// Este layout NÃO adiciona nenhum elemento visual — as páginas dentro do
// grupo já trazem o seu próprio Sidebar/Navbar. A única responsabilidade
// aqui é a verificação de sessão no servidor, antes de qualquer child
// renderizar.
//
// NOTA sobre /admin: a rota /admin também vive dentro deste route group
// (confirmado pela listagem de pastas). Por isso este layout permite
// tanto "client" como "admin" passarem — a restrição específica de que
// só admin acede a /admin fica a cargo do layout mais específico
// (dashboard)/admin/layout.tsx, que corre A SEGUIR a este, dentro da
// mesma árvore de render. Um client autenticado que tente aceder a
// /admin é bloqueado nesse segundo layout, não neste.
// ═══════════════════════════════════════════════════════════════════════

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["client", "admin"]);

  return <>{children}</>;
}