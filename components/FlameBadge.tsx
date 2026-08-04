export default function FlameBadge({ niveau }: { niveau: 0 | 1 | 2 | 3 }) {
  const labels = ["Eteinte", "Faible", "Stable", "Intense"];
  const icons = ["—", "🔥", "🔥🔥", "🔥🔥🔥"];
  const glow = ["", "shadow-[0_0_10px_rgba(255,90,31,0.3)]", "shadow-[0_0_16px_rgba(255,90,31,0.5)]", "shadow-[0_0_24px_rgba(255,90,31,0.8)]"];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1b1d23] border border-[#3a3e4a] ${glow[niveau]}`}>
      <span className="text-sm">{icons[niveau]}</span>
      <span className="text-xs uppercase tracking-wide text-[#8b8d98]">{labels[niveau]}</span>
    </div>
  );
}
