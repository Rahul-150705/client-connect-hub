import { useEffect, useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';

type MenuItem = {
  label: string;
  items: { title: string; description: string }[];
};

const MENU: MenuItem[] = [
  {
    label: 'Features',
    items: [
      { title: 'Policies', description: 'Track every policy in one place' },
      { title: 'Clients', description: 'Centralized client management' },
      { title: 'Automations', description: 'Renewal reminders that just work' },
    ],
  },
  {
    label: 'Enterprise',
    items: [
      { title: 'Security', description: 'SOC2, encryption at rest' },
      { title: 'SSO & SAML', description: 'Enterprise authentication' },
      { title: 'SLAs', description: '99.99% uptime commitments' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { title: 'Docs', description: 'Guides and API references' },
      { title: 'Blog', description: 'Stories from the team' },
      { title: 'Changelog', description: "What's new this month" },
    ],
  },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/40 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-10 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-white font-bold text-lg">
          <span className="h-7 w-7 rounded-md bg-gradient-to-br from-orange-400 to-amber-500 grid place-items-center text-black font-black">
            I
          </span>
          Insurly
        </a>

        <div
          className="hidden md:flex items-center gap-1"
          onMouseLeave={() => setHovered(null)}
        >
          {MENU.map((m) => (
            <div
              key={m.label}
              className="relative"
              onMouseEnter={() => setHovered(m.label)}
            >
              <button
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors ${
                  hovered === null
                    ? 'text-white/80 hover:text-white'
                    : hovered === m.label
                    ? 'text-white'
                    : 'text-white/40'
                }`}
              >
                {m.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
              {hovered === m.label && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-72 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl p-2 shadow-2xl">
                    {m.items.map((item) => (
                      <a
                        key={item.title}
                        href="#"
                        className="block rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
                      >
                        <div className="text-sm font-medium text-white">{item.title}</div>
                        <div className="text-xs text-white/50 mt-0.5">{item.description}</div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="/login" className="text-sm text-white/80 hover:text-white transition-colors">
            Sign in
          </a>
          <a
            href="/signup"
            className="rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 transition"
          >
            Get started
          </a>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        } bg-black/90 backdrop-blur-xl border-t border-white/10`}
      >
        <div className="px-6 py-4 space-y-1">
          {MENU.map((m) => {
            const isOpen = mobileSection === m.label;
            return (
              <div key={m.label} className="border-b border-white/5 last:border-0">
                <button
                  onClick={() => setMobileSection(isOpen ? null : m.label)}
                  className="w-full flex items-center justify-between py-3 text-white"
                >
                  <span className="font-medium">{m.label}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ${
                    isOpen ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="pb-3 pl-2 space-y-2">
                    {m.items.map((it) => (
                      <a
                        key={it.title}
                        href="#"
                        className="block py-1.5 text-sm text-white/70 hover:text-white"
                      >
                        {it.title}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex flex-col gap-2 pt-4">
            <a
              href="/login"
              className="text-center py-2 text-white/80 border border-white/10 rounded-full"
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="text-center py-2 bg-white text-black rounded-full font-semibold"
            >
              Get started
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;