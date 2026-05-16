import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Serviapp — O serviço certo, já.",
  description: "Plataforma que liga clientes a prestadores de serviços verificados em Angola.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body style={{ fontFamily: inter.style.fontFamily, margin: 0, padding: 0, background: "#0d1117" }}>
        {children}
      </body>
    </html>
  );
}