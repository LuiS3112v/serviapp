/**
 * Configuração central da identidade PWA.
 *
 * IMPORTANTE: quando o nome da plataforma e a logo forem trocados,
 * este é o ÚNICO ficheiro que precisa de ser editado (além de
 * substituir os ficheiros de ícone em /public — ver secção abaixo).
 *
 * Nada neste projeto deve referenciar "Serviapp" fora deste ficheiro
 * para efeitos de PWA/metadata.
 */

export const PWA_CONFIG = {
  /** Nome completo da aplicação (usado no manifest e no apple-web-app-title) */
  name: "Mestroo",

  /** Nome curto — usado como label do ícone no ecrã inicial (máx. ~12 caracteres) */
  shortName: "Mestroo",

  /** Descrição curta usada no manifest */
  description:
    "Plataforma que liga clientes a prestadores de serviços verificados em Angola.",

  /**
   * Cor de fundo do splash screen enquanto o PWA carrega.
   * Usa o token --dark do design system (globals.css).
   */
  backgroundColor: "#0d1117",

  /**
   * Cor da theme (barra de status/endereço do browser em modo standalone).
   * Usa o token --teal do design system (globals.css).
   */
  themeColor: "#1D9E75",

  /**
   * Caminhos dos ícones. Estes ficheiros são PLACEHOLDERS temporários
   * (monograma simples sobre fundo sólido) gerados apenas para o PWA
   * ser instalável desde já. Substitui os ficheiros físicos em
   * /public quando a logo definitiva estiver pronta — não é preciso
   * alterar mais nenhum código, os caminhos mantêm-se os mesmos.
   */
  icons: {
    icon192: "/icon-192.png",
    icon512: "/icon-512.png",
    maskable512: "/icon-512-maskable.png",
    appleTouchIcon: "/apple-touch-icon.png",
  },
} as const;

/**
 * URL base de produção da aplicação.
 * Lida de env var — define NEXT_PUBLIC_APP_URL no .env.local / .env.production.
 * Nunca hardcoded: garante que o start_url/scope do manifest aponta
 * sempre para o domínio real configurado no ambiente.
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}