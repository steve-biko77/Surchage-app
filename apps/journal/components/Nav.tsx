"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconSun,
  IconWeek,
  IconFlame,
  IconTarget,
  IconRepeat,
  IconBook,
  IconChart,
  IconCompass,
} from "./icons";

type Item = {
  href: string;
  label: string;
  short: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const GROUPES: { titre: string; items: Item[] }[] = [
  {
    titre: "Quotidien",
    items: [
      { href: "/jour", label: "Jour", short: "Jour", Icon: IconSun },
      { href: "/semaine", label: "Semaine", short: "Semaine", Icon: IconWeek },
      { href: "/journal", label: "Journal", short: "Journal", Icon: IconBook },
    ],
  },
  {
    titre: "Suivi",
    items: [
      { href: "/disciplines", label: "Disciplines", short: "Discip.", Icon: IconFlame },
      { href: "/objectifs", label: "Objectifs", short: "Object.", Icon: IconTarget },
      { href: "/recurrentes", label: "Récurrentes", short: "Récur.", Icon: IconRepeat },
    ],
  },
  {
    titre: "Analyse",
    items: [{ href: "/rapport", label: "Rapport", short: "Rapport", Icon: IconChart }],
  },
];

const TOUS = GROUPES.flatMap((g) => g.items);

function estActif(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    );
  }, []);

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-mark">
          <IconCompass />
        </div>
        <div>
          <div className="sb-title">Journal</div>
          <div className="sb-sub">Productivity Core</div>
        </div>
      </div>

      <nav className="sb-nav">
        {GROUPES.map((g, gi) => (
          <div key={g.titre} style={{ marginTop: gi === 0 ? 0 : 18 }}>
            <div className="sb-section">{g.titre}</div>
            {g.items.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={`sb-item ${estActif(pathname, href) ? "active" : ""}`}>
                <Icon />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="sb-card">
          <strong style={{ textTransform: "capitalize" }}>{date || " "}</strong>
          <p>Une journée remplie vaut mieux qu&apos;une semaine planifiée.</p>
        </div>
      </div>
    </aside>
  );
}

export function MobileBar() {
  const pathname = usePathname();
  return (
    <nav className="mobilebar">
      {TOUS.map(({ href, short, Icon }) => (
        <Link key={href} href={href} className={`mb-item ${estActif(pathname, href) ? "active" : ""}`}>
          <Icon />
          {short}
        </Link>
      ))}
    </nav>
  );
}
