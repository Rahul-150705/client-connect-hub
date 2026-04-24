import React from 'react';

interface PayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface GlassTooltipProps {
  active?: boolean;
  payload?: PayloadEntry[];
  label?: string | number;
  valueSuffix?: string;
}

/** Custom Recharts tooltip with glassmorphism. */
export const GlassTooltip: React.FC<GlassTooltipProps> = ({ active, payload, label, valueSuffix = '' }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-tooltip min-w-[140px]">
      {label !== undefined && (
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || '#2BC8B7' }} />
              <span className="text-white/80">{entry.name}</span>
            </span>
            <span className="font-bold text-white">{entry.value}{valueSuffix}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlassTooltip;