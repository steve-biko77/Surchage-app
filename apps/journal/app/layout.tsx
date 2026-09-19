import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabNav from "@/components/TabNav";
import ToastHost from "@/components/ToastHost";
import InstallBanner from "@/components/InstallBanner";
import PushSubscribe from "@/components/PushSubscribe";

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
  themeColor: "#2C8FE0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="wrap">
          <div className="brand">
            <h1>Journal</h1>
            <span className="tag">Organisation · Disciplines</span>
          </div>
          <p className="subtitle">Tâches, semaine, disciplines qui se suivent tout seuls, objectifs concrets.</p>
          <InstallBanner />
          <PushSubscribe />
          <TabNav />
          <main>{children}</main>
        </div>
        <ToastHost />
      </body>
    </html>
  );
}
