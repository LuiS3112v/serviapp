import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { PWA_CONFIG } from "@/lib/pwa-config";
import { SWRegister } from "./sw-register";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
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
      <head>
        {/* iPhone 16 Pro Max */}
        <link rel="apple-touch-startup-image" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone_1290x2796.png" />
        {/* iPhone 16 Pro / 15 Pro / 14 Pro */}
        <link rel="apple-touch-startup-image" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone_1179x2556.png" />
        {/* iPhone 16 / 15 / 14 / 13 / 12 */}
        <link rel="apple-touch-startup-image" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone_1170x2532.png" />
        {/* iPhone 11 Pro / XS / X */}
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone_1125x2436.png" />
        {/* iPhone 11 / XR */}
        <link rel="apple-touch-startup-image" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/iphone_828x1792.png" />
        {/* iPhone SE / 8 / 7 */}
        <link rel="apple-touch-startup-image" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/iphone_750x1334.png" />
        {/* iPad Pro 12.9" */}
        <link rel="apple-touch-startup-image" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/ipad_2048x2732.png" />
        {/* iPad Pro 11" / Air */}
        <link rel="apple-touch-startup-image" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/ipad_1668x2388.png" />
        {/* iPad 10.2" */}
        <link rel="apple-touch-startup-image" media="(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" href="/splash/ipad_1620x2160.png" />
      </head>
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
      </body>
    </html>
  );
}