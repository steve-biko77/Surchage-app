"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

/* Icônes maison en SVG inline — évite toute dépendance à l'API exacte
   d'une bibliothèque d'icônes externe, trait fin cohérent avec le thème. */
function IconSun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}
function IconGrid(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </svg>
  );
}
function IconFlame(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2.5c1.3 2.6 4.5 4.8 4.5 9a4.5 4.5 0 1 1-9 0c0-1.6.8-2.6 1.6-3.5-.2 1.4.4 2 1 2.1.1-2.8 1.1-4.4 1.9-7.6Z" />
    </svg>
  );
}
function IconTarget(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconRepeat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 7.5h11.5A3.5 3.5 0 0 1 19 11v1.5M20 16.5H8.5A3.5 3.5 0 0 1 5 13V11.5" />
      <path d="M7.2 4.5 4 7.5l3.2 3M16.8 19.5 20 16.5l-3.2-3" />
    </svg>
  );
}
function IconBook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3.5 5.5c2.2-1.2 5-1.2 7 0v13c-2-1.2-4.8-1.2-7 0Z" />
      <path d="M17.5 5.5c-2.2-1.2-5-1.2-7 0v13c2-1.2 4.8-1.2 7 0Z" />
    </svg>
  );
}
function IconChart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </svg>
  );
}

const TABS = [
  { href: "/jour", label: "Jour", Icon: IconSun },
  { href: "/semaine", label: "Semaine", Icon: IconGrid },
  { href: "/disciplines", label: "Disciplines", Icon: IconFlame },
  { href: "/objectifs", label: "Objectifs", Icon: IconTarget },
  { href: "/recurrentes", label: "Récur.", Icon: IconRepeat },
  { href: "/journal", label: "Journal", Icon: IconBook },
  { href: "/rapport", label: "Rapport", Icon: IconChart },
];

export default function TabNav() {
  const pathname = usePathname();
  return (
    <nav className="tabs">
      {TABS.map(({ href, label, Icon }) => {
        const actif = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} className={`tab-btn ${actif ? "active" : ""}`}>
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
