import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { PWA_CONFIG } from "@/lib/pwa-config";
import { SWRegister } from "./sw-register";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { IosSplash } from "@/components/pwa/IosSplash";
import NextTopLoader from "nextjs-toploader";
import { KeepAlive } from "@/components/KeepAlive";
import { ViewportGuard } from "@/components/pwa/ViewportGuard";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mestroo-two.vercel.app"),
  title: {
    default: "Mestroo — O serviço certo, já.",
    template: "%s | Mestroo",
  },
  description:
    "Plataforma que liga clientes a prestadores de serviços verificados em Luanda, Angola. Eletricista, canalizador, limpeza, jardinagem e mais.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "pt_AO",
    url: "https://mestroo-two.vercel.app",
    siteName: "Mestroo",
    title: "Mestroo — O serviço certo, já.",
    description:
      "Plataforma que liga clientes a prestadores de serviços verificados em Luanda, Angola.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mestroo — O serviço certo, já.",
    description:
      "Plataforma que liga clientes a prestadores de serviços verificados em Luanda, Angola.",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    // "black-translucent" deixa o conteúdo ir até ao topo (debaixo da
    // status bar), dando um look mais imersivo — igual ao comportamento
    // nativo de apps iOS. Se preferires barra branca normal, usa "default".
    statusBarStyle: "black-translucent",
    title: PWA_CONFIG.shortName,
    // startupImage é gerido dinamicamente pelo IosSplash (canvas),
    // porque o iOS exige imagens exatas para cada resolução de ecrã.
    // Não definir aqui evita conflitos com o link injetado via JS.
  },
  icons: {
    apple: [
      // apple-touch-icon — ícone que aparece no ecrã inicial do iPhone
      { url: PWA_CONFIG.icons.appleTouchIcon, sizes: "180x180", type: "image/png" },
    ],
    icon: [
      { url: PWA_CONFIG.icons.icon192, sizes: "192x192", type: "image/png" },
      { url: PWA_CONFIG.icons.icon512, sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: PWA_CONFIG.themeColor,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={manrope.variable}>
      <body>
        <NextTopLoader
          color="#1D9E75"
          height={2}
          showSpinner={false}
          shadow="0 0 6px #1D9E75"
        />
        <KeepAlive />
        <ViewportGuard />
        {children}
        <SWRegister />
        <InstallPrompt />
        {/*
          Gera o splash screen para iOS dinamicamente via Canvas.
          O iOS ignora o manifest.webmanifest para splash screens e
          exige apple-touch-startup-image — este componente injeta
          automaticamente a imagem certa para o ecrã atual.
        */}
        <IosSplash />
      </body>
    </html>
  );
}