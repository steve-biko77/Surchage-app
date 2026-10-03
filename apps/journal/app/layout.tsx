import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import TabNav from "@/components/TabNav";
import ToastHost from "@/components/ToastHost";
import InstallBanner from "@/components/InstallBanner";
import OpeningSequence from "@/components/OpeningSequence";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
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
    statusBarStyle: "black-translucent",
    title: "Journal",
  },
  other: {
    // Ancien nom du tag "capable" (mobile-web-app-capable) -- garde la compatibilite
    // avec les versions d'iOS Safari qui ne reconnaissent que le prefixe apple-.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e1a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <OpeningSequence />
        <div className="wrap">
          <div className="brand">
            <h1>Journal</h1>
          </div>
          <p className="subtitle">Tâches, semaine, disciplines qui se suivent tout seuls, objectifs concrets.</p>
          <div className="header-rule" />
          <InstallBanner />
          <main>{children}</main>
        </div>
        <TabNav />
        <ToastHost />
      </body>
    </html>
  );
}
