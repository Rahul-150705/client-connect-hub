import { Zap, Settings2, Sparkles, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type Feature = { icon: LucideIcon; title: string; description: string };

const FEATURES: Feature[] = [
  {
    icon: Zap,
    title: 'Lightning fast',
    description: 'Sub-100ms interactions across the entire workspace, even with 100k+ policies.',
  },
  {
    icon: Settings2,
    title: 'Configurable workflows',
    description: 'Tailor renewal cadences, approvals and notifications to your team.',
  },
  {
    icon: Sparkles,
    title: 'AI suggestions',
    description: 'Smart prompts surface upsell, cross-sell and renewal moments automatically.',
  },
];

const Features = () => {
  return (
    <section className="relative z-10 py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-orange-300 uppercase mb-4">
            Built for brokers
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Everything you need.
            <br />
            <span className="text-white/50">Nothing you don't.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="relative overflow-hidden border-white/10 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-colors group"
            >
              {/* decorative grid bg */}
              <div
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl group-hover:bg-orange-500/20 transition-colors" />
              <CardContent className="relative p-8">
                <div className="h-11 w-11 rounded-xl border border-white/10 bg-gradient-to-br from-orange-400/20 to-orange-600/10 grid place-items-center mb-5">
                  <f.icon className="h-5 w-5 text-orange-300" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;