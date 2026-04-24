import React, { useMemo } from 'react';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  fill?: boolean;
}

/** Tiny, dependency-free sparkline. Renders an SVG polyline + optional area fill. */
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#2BC8B7',
  width = 80,
  height = 28,
  strokeWidth = 1.5,
  fill = true,
}) => {
  const { points, area } = useMemo(() => {
    if (!data || data.length === 0) return { points: '', area: '' };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = data.length > 1 ? width / (data.length - 1) : width;
    const coords = data.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const line = coords.join(' ');
    const areaPath = `M0,${height} L${line.replace(/ /g, ' L')} L${width},${height} Z`;
    return { points: line, area: areaPath };
  }, [data, width, height]);

  if (!data || data.length === 0) return null;

  const gradId = `spark-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradId})`} />}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline;