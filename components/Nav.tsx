"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Séance", icon: "🏋️" },
  { href: "/objectifs", label: "Objectifs", icon: "🎯" },
  { href: "/calendrier", label: "Calendrier", icon: "🔥" },
  { href: "/progression", label: "Progression", icon: "📈" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1b1d23] border-t border-[#3a3e4a] flex justify-around py-2 max-w-xl mx-auto">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
              active ? "text-[#FF5A1F]" : "text-[#8b8d98]"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
