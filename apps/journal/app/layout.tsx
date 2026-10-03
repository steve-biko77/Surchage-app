import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Sidebar, MobileBar } from "@/components/Nav";
import ToastHost from "@/components/ToastHost";
import InstallBanner from "@/components/InstallBanner";
import OpeningSequence from "@/components/OpeningSequence";
import SpotlightLayer from "@/components/SpotlightLayer";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Journal — Organisation & Disciplines",
  description: "Module Journal — Productivity Core",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Journal",
  },
  other: {
    // Ancien nom du tag "capable" (mobile-web-app-capable) -- garde la compatibilite
    // avec les versions d'iOS Safari qui ne reconnaissent que le prefixe apple-.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#eef4fb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${sans.variable}`}>
      <body>
        <OpeningSequence />
        <SpotlightLayer />
        <div className="app">
          <Sidebar />
          <div className="content">
            <InstallBanner />
            {children}
          </div>
        </div>
        <MobileBar />
        <ToastHost />
      </body>
    </html>
  );
}
