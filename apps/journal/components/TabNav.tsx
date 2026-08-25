"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/jour", label: "Jour" },
  { href: "/semaine", label: "Semaine" },
  { href: "/disciplines", label: "Disciplines" },
  { href: "/objectifs", label: "Objectifs" },
];

export default function TabNav() {
  const pathname = usePathname();
  return (
    <nav className="tabs">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`tab-btn ${pathname.startsWith(t.href) ? "active" : ""}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
