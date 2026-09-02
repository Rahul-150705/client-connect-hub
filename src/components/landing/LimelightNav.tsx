import { useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { Home, Compass, Bell, User, type LucideProps } from 'lucide-react';

export type LimelightNavItem = {
  id: string;
  label: string;
  icon: ComponentType<LucideProps>;
};

const DEFAULT_ITEMS: LimelightNavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

interface Props {
  items?: LimelightNavItem[];
  defaultActiveId?: string;
  onChange?: (id: string) => void;
}

const LimelightNav = ({ items = DEFAULT_ITEMS, defaultActiveId, onChange }: Props) => {
  const [activeId, setActiveId] = useState(defaultActiveId ?? items[0]?.id);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [light, setLight] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = itemRefs.current[activeId];
    const container = containerRef.current;
    if (!el || !container) return;
    const cRect = container.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    setLight({ left: eRect.left - cRect.left, width: eRect.width });
  }, [activeId, items]);

  return (
    <div className="inline-flex justify-center">
      <div
        ref={containerRef}
        className="relative inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl"
      >
        {/* limelight */}
        <span
          aria-hidden
          className="absolute top-1.5 bottom-1.5 rounded-full bg-white/10 transition-all duration-300 ease-out"
          style={{ left: light.left, width: light.width }}
        />
        <span
          aria-hidden
          className="absolute -top-3 h-3 transition-all duration-300 ease-out"
          style={{
            left: light.left + light.width / 2 - 12,
            width: 24,
            background:
              'radial-gradient(ellipse at bottom, rgba(251,146,60,0.85), transparent 70%)',
            filter: 'blur(2px)',
          }}
        />
        {items.map((it) => {
          const Icon = it.icon;
          const active = activeId === it.id;
          return (
            <button
              key={it.id}
              ref={(el) => (itemRefs.current[it.id] = el)}
              onClick={() => {
                setActiveId(it.id);
                onChange?.(it.id);
              }}
              aria-label={it.label}
              className={`relative z-10 grid h-10 w-12 place-items-center rounded-full transition-colors ${
                active ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon className="h-4.5 w-4.5" size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LimelightNav;