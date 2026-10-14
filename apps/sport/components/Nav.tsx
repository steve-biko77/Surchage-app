"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Target, Flame, LineChart, ClipboardList } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Séance", labelLong: "Séance du jour", Icon: Dumbbell },
  { href: "/entrainements", label: "Entraîn.", labelLong: "Entraînements", Icon: ClipboardList },
  { href: "/objectifs", label: "Objectifs", labelLong: "Objectifs", Icon: Target },
  { href: "/calendrier", label: "Calendrier", labelLong: "Calendrier", Icon: Flame },
  { href: "/progression", label: "Progression", labelLong: "Progression", Icon: LineChart },
];

/** Barre basse — mobile et tablette étroite uniquement. */
export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="barre-mobile" aria-label="Navigation principale">
      <div className="flex justify-around">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="relative flex min-w-11 flex-1 flex-col items-center gap-1 px-3 py-2.5 text-xs transition-colors duration-150"
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(var(--accent-rgb),0.7)]" />
              )}
              <Icon
                className={`h-5 w-5 transition-colors duration-150 ${active ? "text-[var(--accent)]" : "text-[var(--grey)]"}`}
                strokeWidth={active ? 2.5 : 2}
                aria-hidden="true"
              />
              <span className={active ? "text-[var(--chalk)] font-medium" : "text-[var(--grey)]"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Colonne latérale — à partir de 1024px. */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="colonne" aria-label="Navigation principale">
      <div className="colonne-marque">
        <div className="colonne-logo">
          <Dumbbell className="h-5 w-5 text-[var(--on-accent)]" strokeWidth={2.5} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="colonne-titre">Surcharge</div>
          <div className="colonne-sous">Module Sport</div>
        </div>
      </div>

      <nav className="colonne-liens">
        {ITEMS.map(({ href, labelLong, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`colonne-lien${active ? " on" : ""}`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
              <span>{labelLong}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
