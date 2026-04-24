import React from 'react';

interface BorderBeamProps {
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
}

/**
 * Animated conic-gradient border beam — sweeps around the parent's edge.
 * Parent must be `relative` and `overflow-hidden` with rounded corners.
 */
export const BorderBeam: React.FC<BorderBeamProps> = ({
  size = 250,
  duration = 6,
  colorFrom = '#ff5e7e',
  colorTo = '#ffb86c',
  className = '',
}) => {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-[inherit] [mask:linear-gradient(white,white)_content-box,linear-gradient(white,white)] [mask-composite:exclude] p-[1.5px] ${className}`}
      style={{
        background: `conic-gradient(from 0deg, transparent 0 70%, ${colorFrom} 80%, ${colorTo} 90%, transparent 100%)`,
        animation: `border-beam-spin ${duration}s linear infinite`,
        // @ts-expect-error css custom prop
        '--size': `${size}px`,
      }}
    />
  );
};

export default BorderBeam;