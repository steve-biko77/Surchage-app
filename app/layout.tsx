import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { Dumbbell } from "lucide-react";

const fontBody = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const fontHeading = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Surcharge — Séance du jour",
  description: "Module Sport — Productivity Core",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fontBody.variable} ${fontHeading.variable}`}>
      <body className="antialiased">
        <div className="max-w-xl mx-auto px-4 pb-28 pt-6">
          <header className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#ff7a45] to-[#c2410c] shadow-[0_4px_16px_-4px_rgba(255,90,31,0.5)]">
              <Dumbbell className="h-5 w-5 text-[#1a0d05]" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-extrabold uppercase tracking-wide leading-none bg-gradient-to-b from-white to-[#FF5A1F] bg-clip-text text-transparent">
                Surcharge
              </h1>
              <p className="text-[11px] text-[var(--grey)] uppercase tracking-widest">Module Sport</p>
            </div>
          </header>
          <main>{children}</main>
        </div>
        <Nav />
      </body>
    </html>
  );
}
