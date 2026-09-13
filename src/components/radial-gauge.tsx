/**
 * Jauge circulaire — visualise une valeur réelle 0-100 (jamais de donnée
 * inventée : carburant/huile en %, ou usure avant échéance de maintenance).
 * `colorClass` définit la teinte de l'arc (text-*), le fond hérite du
 * conteneur sombre via `text-slate-700`.
 */
export function RadialGauge({
  value,
  label,
  colorClass,
  size = 96,
}: {
  value: number;
  label: string;
  colorClass: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-700" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            stroke="currentColor"
            className={colorClass}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-white">{Math.round(clamped)}%</div>
      </div>
      <p className="text-center text-xs text-slate-300">{label}</p>
    </div>
  );
}
