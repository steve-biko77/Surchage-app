"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Target, Flame, LineChart, ClipboardList } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Séance", Icon: Dumbbell },
  { href: "/entrainements", label: "Entraîn.", Icon: ClipboardList },
  { href: "/objectifs", label: "Objectifs", Icon: Target },
  { href: "/calendrier", label: "Calendrier", Icon: Flame },
  { href: "/progression", label: "Progression", Icon: LineChart },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--card-border)] bg-[var(--bg-card)]/95 backdrop-blur-md max-w-xl mx-auto"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
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
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--iron)] shadow-[0_0_8px_rgba(255,90,31,0.7)]" />
              )}
              <Icon
                className={`h-5 w-5 transition-colors duration-150 ${active ? "text-[var(--iron)]" : "text-[var(--grey)]"}`}
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
