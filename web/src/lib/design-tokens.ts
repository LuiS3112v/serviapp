/**
 * Tokens de design partilhados entre Cliente e Provider.
 *
 * Estes valores NÃO são novos — foram extraídos dos hardcoded já em uso
 * em Sidebar.tsx, Navbar.tsx, ProviderSidebar.tsx, ProviderNavbar.tsx e
 * provider-home/page.tsx (INK #0F172A, MUTED #64748B, LINE #E2E8F0,
 * verde da marca #0E7A5F, âmbar do provider #EF9F27, etc.).
 *
 * O objetivo é ter uma única fonte de verdade para estes valores em vez
 * de cada componente os repetir localmente. Nenhuma cor, espaçamento ou
 * comportamento visual muda — só passam a vir de um só sítio.
 */

export const TOKENS = {
  color: {
    ink: "#0F172A",
    muted: "#64748B",
    faint: "#94A3B8",
    line: "#E2E8F0",
    surface: "#F8FAFC",
    white: "#FFFFFF",
    brand: "#0E7A5F",
    brandSoft: "#EAF4F0",
    provider: "#EF9F27",
    providerSoft: "#FCEFDA",
    danger: "#EF4444",
    dangerSoft: "#FEF2F2",
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
} as const;

/** Largura da sidebar desktop — igual em Sidebar.tsx e ProviderSidebar.tsx. */
export const SIDEBAR_WIDTH = 240;

/**
 * Altura da bottom nav mobile + espaço de segurança (notch/home indicator
 * em iOS). Usado tanto pelo próprio BottomNav como por qualquer página
 * que precise reservar espaço no fundo do ecrã (ex: padding-bottom do
 * layout do Cliente) para o conteúdo não ficar escondido atrás da barra.
 */
export const BOTTOM_NAV_HEIGHT = 60;
export const BOTTOM_NAV_SAFE_AREA = "env(safe-area-inset-bottom, 0px)";

/** Breakpoint a partir do qual a bottom nav aparece — mesmo breakpoint
 * já usado em Sidebar.tsx/ProviderSidebar.tsx para trocar para o drawer. */
export const MOBILE_BREAKPOINT = 1024;

/**
 * Rotas onde a BottomNav é mostrada — só as duas Homes, não a app
 * inteira. Fora destas rotas o BottomNav não é montado (ver
 * BottomNav.tsx), tal como pedido: navegação contextual da Home, não
 * um elemento permanente em todas as páginas.
 */
export const CLIENT_HOME_ROUTE = "/home";
export const PROVIDER_HOME_ROUTE = "/provider-home";