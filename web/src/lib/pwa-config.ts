export const PWA_CONFIG = {
  name: "Mestroo",
  shortName: "Mestroo",
  description:
    "Plataforma que liga clientes a prestadores de serviços verificados em Angola.",
  backgroundColor: "#ffffff",
  themeColor: "#1D9E75",
  icons: {
    icon192: "/icon-192.png",
    icon512: "/icon-512.png",
    maskable512: "/icon-512-maskable.png",
    appleTouchIcon: "/apple-touch-icon.png",
  },
} as const;

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}