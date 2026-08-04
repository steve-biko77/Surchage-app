import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Surcharge — Séance du jour",
  description: "Module Sport — Productivity Core",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <div className="max-w-xl mx-auto px-4 pb-24 pt-6">
          <header className="mb-6">
            <h1 className="text-3xl font-black tracking-wide uppercase bg-gradient-to-b from-white to-[#FF5A1F] bg-clip-text text-transparent">
              Surcharge
            </h1>
            <p className="text-xs text-[#8b8d98] uppercase tracking-widest">Module Sport · Productivity Core</p>
          </header>
          {children}
        </div>
        <Nav />
      </body>
    </html>
  );
}
