import type { Metadata } from "next";
import "./globals.css";
import TabNav from "@/components/TabNav";
import ToastHost from "@/components/ToastHost";

export const metadata: Metadata = {
  title: "Journal — Organisation & Disciplines",
  description: "Module Journal — Productivity Core",
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
          <TabNav />
          <main>{children}</main>
        </div>
        <ToastHost />
      </body>
    </html>
  );
}
