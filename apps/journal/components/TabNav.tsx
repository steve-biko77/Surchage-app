"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/jour", label: "Jour" },
  { href: "/semaine", label: "Semaine" },
  { href: "/disciplines", label: "Disciplines" },
  { href: "/objectifs", label: "Objectifs" },
  { href: "/journal", label: "Journal" },
];

export default function TabNav() {
  const pathname = usePathname();
  return (
    <nav className="tabs">
      {TABS.map((t) => {
        const actif = pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link key={t.href} href={t.href} className={`tab-btn ${actif ? "active" : ""}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
