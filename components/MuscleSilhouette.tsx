"use client";

const ZONES: Record<string, string> = {
  epaules: "M60,58 a14,14 0 1,1 0.1,0 M140,58 a14,14 0 1,1 0.1,0",
  pectoraux: "M72,70 q28,-14 56,0 l0,26 q-28,12 -56,0 z",
  biceps: "M52,74 q-10,4 -12,30 q10,4 16,-2 z M148,74 q10,4 12,30 q-10,4 -16,-2 z",
  triceps: "M50,78 q-8,10 -6,34 l10,-2 q-2,-20 4,-30 z M150,78 q8,10 6,34 l-10,-2 q2,-20 -4,-30 z",
  "avant-bras": "M44,108 q-6,14 -2,34 l12,2 q-4,-18 2,-34 z M156,108 q6,14 2,34 l-12,2 q4,-18 -2,-34 z",
  abdominaux: "M78,98 l44,0 l0,40 q-22,10 -44,0 z",
  dos: "M70,68 l60,0 l0,60 q-30,14 -60,0 z",
  jambes: "M76,146 q-8,50 -6,80 l20,0 q2,-40 10,-70 z M124,146 q8,50 6,80 l-20,0 q-2,-40 -10,-70 z",
  mollets: "M78,208 q-4,24 0,40 l16,0 q-2,-20 0,-40 z M122,208 q4,24 0,40 l-16,0 q2,-20 0,-40 z",
};

export default function MuscleSilhouette({ groupe }: { groupe: string }) {
  const highlight = ZONES[groupe];
  return (
    <svg viewBox="0 0 200 260" className="w-16 h-20 shrink-0">
      {/* Silhouette de base */}
      <circle cx="100" cy="30" r="18" fill="#2a2c34" />
      <path
        d="M60,58 q40,-16 80,0 l6,60 q-8,20 -6,50 l4,80 q-16,10 -44,10 q-6,-30 -0,-60 q6,30 0,60 q-28,0 -44,-10 l4,-80 q2,-30 -6,-50 z"
        fill="#22242c"
        stroke="#3a3e4a"
        strokeWidth="1.5"
      />
      {highlight && (
        <path d={highlight} fill="#FF5A1F" opacity="0.85" style={{ filter: "drop-shadow(0 0 6px #FF5A1F)" }} />
      )}
    </svg>
  );
}
