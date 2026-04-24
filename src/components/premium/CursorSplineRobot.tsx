import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

/**
 * Floating Spline 3D robot in the bottom-right corner.
 * The wrapper subtly translates toward the cursor (parallax) using rAF —
 * the Spline scene itself also handles internal mouse interactions if it
 * exposes them. Disabled on small screens for performance.
 */
export const CursorSplineRobot: React.FC<{ scene?: string }> = ({
  scene = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode',
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setEnabled(true);

    const handleMove = (e: MouseEvent) => {
      // Target offset capped to ±12px
      const nx = (e.clientX / window.innerWidth - 0.5) * 24;
      const ny = (e.clientY / window.innerHeight - 0.5) * 24;
      targetRef.current = { x: nx, y: ny };
    };

    const tick = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.08;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.08;
      if (wrapRef.current) {
        wrapRef.current.style.transform =
          `translate3d(${currentRef.current.x.toFixed(2)}px, ${currentRef.current.y.toFixed(2)}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed bottom-6 right-6 w-[220px] h-[220px] z-30 pointer-events-none animate-float"
      style={{ willChange: 'transform' }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <div className="w-full h-full pointer-events-auto opacity-90">
          <Spline scene={scene} />
        </div>
      </Suspense>
    </div>
  );
};

export default CursorSplineRobot;