import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { PWA_CONFIG } from "@/lib/pwa-config";
import { SWRegister } from "./sw-register";
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
    statusBarStyle: "default",
    title: PWA_CONFIG.shortName,
  },
  icons: {
    apple: PWA_CONFIG.icons.appleTouchIcon,
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
        {children}
        <SWRegister />
      </body>
    </html>
  );
}