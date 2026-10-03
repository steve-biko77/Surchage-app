"use client";
import { useEffect, useId, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   Instruments de mesure — SVG dessiné à la main, animé au montage.
   Aucune librairie de graphiques : le trait, les rayons et les
   dégradés sont calculés ici pour coller exactement au thème.
   ═══════════════════════════════════════════════════════════════ */

/** Déclenche l'animation d'entrée une frame après le montage. */
function useReveal(delay = 0) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), delay + 30);
    return () => clearTimeout(t);
  }, [delay]);
  return on;
}

/* ─────────────────── Jauge semi-circulaire à aiguille ─────────────────── */

export function GaugeArc({
  value,
  size = 230,
  label,
  caption,
}: {
  value: number;
  size?: number;
  label?: string;
  caption?: string;
}) {
  const on = useReveal(120);
  const id = useId().replace(/:/g, "");
  const v = Math.max(0, Math.min(100, value));
  const R = 80;
  const C = Math.PI * R; // longueur de l'arc semi-circulaire
  const angle = (on ? v : 0) / 100 * 180;

  return (
    <div style={{ width: size, maxWidth: "100%" }}>
      <svg viewBox="0 0 200 128" style={{ width: "100%", display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#de5168" />
            <stop offset="42%" stopColor="#e2912c" />
            <stop offset="78%" stopColor="#3ec8a8" />
            <stop offset="100%" stopColor="#0ea98f" />
          </linearGradient>
          <filter id={`s${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0d2a4c" floodOpacity="0.28" />
          </filter>
        </defs>

        {/* Piste */}
        <path
          d={`M 20 100 A ${R} ${R} 0 0 1 180 100`}
          fill="none"
          stroke="#e8eff7"
          strokeWidth={13}
          strokeLinecap="round"
        />
        {/* Valeur */}
        <path
          d={`M 20 100 A ${R} ${R} 0 0 1 180 100`}
          fill="none"
          stroke={`url(#g${id})`}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (C * (on ? v : 0)) / 100}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)" }}
        />
        {/* Graduations */}
        {[0, 25, 50, 75, 100].map((t) => {
          const a = (t / 100) * 180 - 180;
          const rad = (a * Math.PI) / 180;
          const x1 = 100 + Math.cos(rad) * (R - 11);
          const y1 = 100 + Math.sin(rad) * (R - 11);
          const x2 = 100 + Math.cos(rad) * (R - 16);
          const y2 = 100 + Math.sin(rad) * (R - 16);
          return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#cfdeec" strokeWidth={1.4} strokeLinecap="round" />;
        })}

        {/* Aiguille */}
        <g
          transform={`rotate(${angle} 100 100)`}
          style={{ transition: "transform 1.25s cubic-bezier(.34,1.3,.5,1)" }}
          filter={`url(#s${id})`}
        >
          <path d="M 100 100 L 30 97.6 L 30 102.4 Z" fill="#0d1b2e" />
        </g>
        <circle cx="100" cy="100" r="7" fill="#fff" stroke="#0d1b2e" strokeWidth={2.4} />
        <circle cx="100" cy="100" r="2.2" fill="#0d1b2e" />
      </svg>

      {(label || caption) && (
        <div style={{ textAlign: "center", marginTop: -6 }}>
          {label && (
            <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.05 }}>{label}</div>
          )}
          {caption && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{caption}</div>}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Radar / toile d'araignée ─────────────────────────── */

export function RadarChart({
  axes,
  size = 260,
}: {
  axes: { label: string; value: number; sub?: string }[];
  size?: number;
}) {
  const on = useReveal(200);
  const id = useId().replace(/:/g, "");
  const n = axes.length;
  const cx = 150;
  const cy = 136;
  const R = 86;

  if (n < 3) return null;

  const pt = (i: number, r: number) => {
    const a = (-90 + (i * 360) / n) * (Math.PI / 180);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };

  const ring = (frac: number) =>
    axes.map((_, i) => pt(i, R * frac).join(",")).join(" ");

  const shape = axes
    .map((a, i) => pt(i, (R * Math.max(4, Math.min(100, a.value))) / 100).join(","))
    .join(" ");

  return (
    <svg viewBox="0 0 300 268" style={{ width: "100%", maxWidth: size, display: "block", margin: "0 auto", overflow: "visible" }}>
      <defs>
        <radialGradient id={`r${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4aa3f5" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#1d7fe0" stopOpacity="0.14" />
        </radialGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="#e3ebf4" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#e8eff7" strokeWidth={1} />;
      })}

      <polygon
        points={shape}
        fill={`url(#r${id})`}
        stroke="#1d7fe0"
        strokeWidth={2}
        strokeLinejoin="round"
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          transform: on ? "scale(1)" : "scale(0.05)",
          opacity: on ? 1 : 0,
          transition: "transform 1s cubic-bezier(.34,1.3,.5,1), opacity .5s ease",
        }}
      />

      {axes.map((a, i) => {
        const [x, y] = pt(i, (R * Math.max(4, Math.min(100, a.value))) / 100);
        return (
          <circle
            key={`d${i}`}
            cx={x}
            cy={y}
            r={3.4}
            fill="#fff"
            stroke="#1d7fe0"
            strokeWidth={2}
            style={{ opacity: on ? 1 : 0, transition: `opacity .4s ease ${0.5 + i * 0.06}s` }}
          />
        );
      })}

      {axes.map((a, i) => {
        const [x, y] = pt(i, R + 22);
        const anchor = x < cx - 6 ? "end" : x > cx + 6 ? "start" : "middle";
        return (
          <g key={`l${i}`} style={{ opacity: on ? 1 : 0, transition: `opacity .5s ease ${0.3 + i * 0.05}s` }}>
            <text x={x} y={y} textAnchor={anchor} fontSize={11} fontWeight={650} fill="#44566e">
              {a.label}
            </text>
            {a.sub && (
              <text x={x} y={y + 12} textAnchor={anchor} fontSize={10} fill="#8699ad">
                {a.sub}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────── Courbe d'aire lissée ─────────────────────────── */

function smooth(points: { x: number; y: number }[], tension = 0.4) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + ((p2.x - p0.x) * tension) / 3;
    const c1y = p1.y + ((p2.y - p0.y) * tension) / 3;
    const c2x = p2.x - ((p3.x - p1.x) * tension) / 3;
    const c2y = p2.y - ((p3.y - p1.y) * tension) / 3;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function AreaChart({
  data,
  accent = "#1d7fe0",
  accentSoft = "#4aa3f5",
  highlight,
}: {
  data: { label: string; value: number }[];
  accent?: string;
  accentSoft?: string;
  highlight?: (d: { label: string; value: number }) => string | null;
}) {
  const on = useReveal(150);
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const W = 600;
  const H = 180;
  const padL = 6;
  const padR = 6;
  const padT = 14;
  const padB = 28;

  if (data.length === 0) return null;

  const stepX = (W - padL - padR) / Math.max(1, data.length - 1);
  const maxV = 100;
  const pts = data.map((d, i) => ({
    x: padL + i * stepX,
    y: padT + (1 - Math.max(0, Math.min(maxV, d.value)) / maxV) * (H - padT - padB),
  }));

  const line = smooth(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${H - padB} L ${pts[0].x} ${H - padB} Z`;

  // N'étiqueter qu'un sous-ensemble quand la série est longue, pour éviter
  // la bouillie de texte sur 30 jours.
  const every = data.length > 14 ? Math.ceil(data.length / 8) : 1;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentSoft} stopOpacity="0.32" />
            <stop offset="100%" stopColor={accentSoft} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((f) => {
          const y = padT + f * (H - padT - padB);
          return <line key={f} x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e8eff7" strokeWidth={1} strokeDasharray={f === 1 ? "0" : "3 4"} />;
        })}

        <path d={area} fill={`url(#a${id})`} style={{ opacity: on ? 1 : 0, transition: "opacity .9s ease .3s" }} />
        <path
          d={line}
          fill="none"
          stroke={accent}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={on ? 0 : 1}
          style={{ transition: "stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)" }}
        />

        {pts.map((p, i) => {
          const hl = highlight?.(data[i]) ?? null;
          const active = hover === i;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={active ? 5.5 : hl ? 4 : 3}
                fill={hl ?? "#fff"}
                stroke={hl ? "#fff" : accent}
                strokeWidth={hl ? 1.6 : 2}
                style={{ opacity: on ? 1 : 0, transition: `opacity .4s ease ${0.6 + i * 0.015}s, r .15s ease` }}
              />
              <rect
                x={p.x - stepX / 2}
                y={0}
                width={stepX}
                height={H - padB}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
            </g>
          );
        })}

        {data.map((d, i) =>
          i % every === 0 || i === data.length - 1 ? (
            <text
              key={`t${i}`}
              x={pts[i].x}
              y={H - 8}
              textAnchor="middle"
              fontSize={10}
              fontWeight={600}
              fill={hover === i ? "#0d1b2e" : "#a9b9c9"}
            >
              {d.label}
            </text>
          ) : null
        )}
      </svg>

      {hover !== null && (
        <div
          style={{
            position: "absolute",
            left: `${(pts[hover].x / W) * 100}%`,
            top: `${(pts[hover].y / H) * 100}%`,
            transform: "translate(-50%, -150%)",
            background: "var(--ink)",
            color: "#fff",
            fontSize: 11.5,
            fontWeight: 600,
            padding: "5px 9px",
            borderRadius: 7,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 18px -8px rgba(13,27,46,.6)",
          }}
        >
          {data[hover].value}% · {data[hover].label}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Anneau de progression ─────────────────────────── */

export function ProgressRing({
  value,
  size = 92,
  stroke = 9,
  color = "#1d7fe0",
  colorSoft = "#4aa3f5",
  children,
  delay = 0,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  colorSoft?: string;
  children?: React.ReactNode;
  delay?: number;
}) {
  const on = useReveal(delay + 120);
  const id = useId().replace(/:/g, "");
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <defs>
          <linearGradient id={`p${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colorSoft} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8eff7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#p${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * (on ? v : 0)) / 100}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────── Micro-courbe (tuiles de stats) ─────────────────────────── */

export function MiniSpark({
  data,
  color = "#4aa3f5",
  variant = "line",
}: {
  data: number[];
  color?: string;
  variant?: "line" | "bars";
}) {
  const on = useReveal(300);
  const id = useId().replace(/:/g, "");
  if (data.length < 2) return null;
  const W = 80;
  const H = 36;
  const max = Math.max(...data, 1);

  // Une série binaire (jour tenu / jour manqué) lissée en courbe donne une
  // vague trompeuse : on la dessine en barres, qui disent la vérité.
  if (variant === "bars") {
    const gap = data.length > 14 ? 1.4 : 3.2;
    const bw = (W - gap * (data.length - 1)) / data.length;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}>
        {data.map((v, i) => {
          const h = Math.max(3, (v / max) * (H - 14));
          return (
            <rect
              key={i}
              x={i * (bw + gap)}
              y={H - 2 - (on ? h : 0)}
              width={bw}
              height={on ? h : 0}
              rx={1.8}
              fill={v > 0 ? color : "#e4ecf5"}
              opacity={v > 0 ? 0.85 : 1}
              style={{ transition: `height .5s cubic-bezier(.22,1,.36,1) ${i * 0.04}s, y .5s cubic-bezier(.22,1,.36,1) ${i * 0.04}s` }}
            />
          );
        })}
      </svg>
    );
  }
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - 4 - (v / max) * (H - 10),
  }));
  const line = smooth(pts);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={`m${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill={`url(#m${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={on ? 0 : 1}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

/* ─────────────────────────── Compteur animé ─────────────────────────── */

export function CountUp({ to, duration = 900, suffix = "" }: { to: number; duration?: number; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // amorti : démarre vite, se pose en douceur
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <>
      {n}
      {suffix}
    </>
  );
}
